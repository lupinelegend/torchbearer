const LIGHT_LEVELS = {
    'Bright': 2,
    'Dim': 1,
    'Dark': 0,
};
export class GrindSheet extends Application {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "Grind Sheet",
            classes: ["torchbearer", "sheet", "grind"],
            template: "systems/torchbearer/templates/grind-template.html",
            width: 850,
            height: 675,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "party" }],
            dragDrop: [{dragSelector: ".actors-list .actor", dropSelector: null}]
        });
    }

    /** @override */
    async getData() {
        let data = super.getData();

        data.grind = await this.currentGrind();
        let tbActors = data.grind.actors.map((actorId) => {
            return game.actors.get(actorId);
        });

        //If any party members have left the system entirely, gotta reset the Grind
        for(let i = 0; i < tbActors.length; i++) {
            if(tbActors[i] === null) {
                ui.notifications.info("Resetting the Grind due to deleted Party member");
                data.grind = await this.resetGrind();
                tbActors = [];
                break;
            }
        }

        if(game.user.isGM) {
            data.isGM = true;
        }
        data.computed = {};
        data.computed.grindImage = data.grind.turn === 0 ?
            '/systems/torchbearer/assets/icons/grind0.svg' :
            `/systems/torchbearer/assets/icons/grind${data.grind.turn % 4 === 0 ? 4 : data.grind.turn % 4}.svg`;

        data.computed.partyChecks = this.computePartyChecks(tbActors);
        data.computed.lightLevels = this.computeLightLevels(data.grind.ambientLight, tbActors);
        data.computed.groundItems = this.catalogGroundItems(tbActors);
        this._grindData = data;
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('#reloadTemplate').on('click', () => {
            delete(_templateCache[this.options.template]);
            this.render(true);
        });
        html.find('#activateGrind').on('click', () => {
            this.activateGrind();
        });
        html.find('#deactivateGrind').on('click', () => {
            this.deactivateGrind();
        });
        html.find('#advanceGrind').on('click', () => {
            this.advanceGrind();
        });
        html.find('#resetGrind').on('click', async () => {
            await this.resetGrind();
            this.loadChars();
        });
        html.find('#loadChars').on('click', () => {
            this.loadChars();
        });
        html.find('#logGrind').on('click', async () => {
            console.log(this._grindData);
        });
        html.find('.change-light').on('click', () => {
            this.changeLight();
        });
        html.find('.actor .actor-image, .actor .actor-name').on('click', (evt) => {
            game.actors.get($(evt.target).closest('.actor').data('actorId')).sheet.render(true);
        });
        html.find('.item .item-image, .item .item-name').on('click', (evt) => {
            const itemNode = $(evt.target).closest('.item');
            if(itemNode.data('actorId')) {
                game.actors.get(itemNode.data('actorId')).getOwnedItem(itemNode.data('itemId')).sheet.render(true);
            } else {
                game.items.get(itemNode.data('itemId')).sheet.render(true);
            }
        });

        // Drop Inventory Item
        html.find('.item-claim').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const claim = {
                type: 'claimRequest',
                fromActor: li.data("actorId"),
                itemId: li.data("itemId"),
                toActor: game.user.data.character,
            };
            this.sendMessage(claim);
        });

    }

    async processClaimRequest(request) {
        if(!game.user.isGM) return;
        const toActor = game.actors.get(request.toActor);
        const fromActor = game.actors.get(request.fromActor);
        const fromItem = fromActor.getOwnedItem(request.itemId);
        await toActor.createEmbeddedEntity("OwnedItem", duplicate(fromItem.data));
        await fromActor.removeItemFromInventory(fromItem.data._id);
        this.sendMessage({type:"grindChanged"});
    }

    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget;
        const tbActor = game.actors.get(li.dataset.actorId);
        const dragData = {
            type: "GrindActor",
            data: tbActor.data
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    _canDragStart(selector) {
        return true;
    }

    _canDragDrop(selector) {
        return true;
    }

    /** @override */
    async _onDrop(event) {
        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.type !== "GrindActor") return;
        } catch (err) {
            return false;
        }
        await this._onSortPartyMember(event, data.data);
    }
    /**
     * Handle a drop event for a party member to sort them
     * @param {Event} event
     * @param {Object} actorData
     * @private
     */
    async _onSortPartyMember(event, actorData) {

        // Get the drag source and its siblings
        //const source = game.actors.get(actorData._id);
        const source = {data: {type: 'Character', _id: actorData._id, sort: this._grindData.grind.actors.indexOf(actorData._id)}}
        const siblings = this._getSortSiblings(source);

        // Get the drop target
        const dropTarget = event.target.closest(".actor");
        const targetId = dropTarget ? dropTarget.dataset.actorId : null;
        const target = siblings.find(s => s.data._id === targetId);

        // Ensure we are only sorting like-types
        if (target && (source.data.type !== target.data.type)) return;

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, {target: target, siblings});
        if(sortUpdates.length === 1) {
            const newActors = [];
            if(sortUpdates[0].update.sort <= 0) {
                newActors.push(source.data._id);
            }
            this._grindData.grind.actors.forEach(aId => {
                if(aId !== source.data._id) {
                    newActors.push(aId);
                }
            });
            if(sortUpdates[0].update.sort > 0) {
                newActors.push(source.data._id);
            }
            await this.updateGrind({actors: newActors}, 'onSortPartyMember');
        } else {
            await this.updateGrind({actors: sortUpdates.map(entry => entry.target.data._id)}, 'onSortPartyMember');
        }
    }

    /* -------------------------------------------- */

    _getSortSiblings(source) {
        return this._grindData.grind.actors.filter(aId => {
            return aId !== source.data._id;
        }).map((aId, idx) => {
            return {data: {type: 'Character', _id: aId, sort: idx}};
        });
    }
    computePartyChecks(tbActors) {
        let sum = 0;
        for(let i = 0; i < tbActors.length; i++) {
            sum += tbActors[i].tbData().computed.totalChecks;
        }
        return sum;
    }

    catalogGroundItems(tbActors) {
        let catalog = [];
        let own = [];
        let total = 0;
        for(let i = 0; i < tbActors.length; i++) {
            const tbActor = tbActors[i];
            const container = tbActor.tbData().computed.inventory['On Ground'];
            let target;
            if(tbActor.owner) {
                target = own;
            } else {
                target = catalog;
            }
            if(container.slots.length > 0) {
                target.push({
                    _actor_id: container.slots[0]._actor_id,
                    container: container
                });
                total += container.slots.length;
            }
        }
        return {
            total: total,
            own: own,
            catalog: catalog,
        };
    }

    computeLightLevels(ambientLight, tbActors) {
        const LIGHT_SEQUENCE = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
        let lightLevels = {};
        for(let i = 0; i < tbActors.length; i++) {
            lightLevels[tbActors[i].data._id] = LIGHT_LEVELS[ambientLight];
        }
        if(ambientLight === 'Bright') return lightLevels;

        for(let i = 0; i < tbActors.length; i++) {
            let emittedLight = tbActors[i].tbData().computed.emittedLight;
            let sequenceIdx = 0;
            for(let powerIdx = 0; powerIdx < emittedLight.characters && sequenceIdx < LIGHT_SEQUENCE.length; powerIdx++, sequenceIdx++) {
                let litCharacterIndex = i + LIGHT_SEQUENCE[sequenceIdx];
                while((litCharacterIndex < 0 || litCharacterIndex >= tbActors.length) && sequenceIdx < LIGHT_SEQUENCE.length) {
                    sequenceIdx += 1;
                    litCharacterIndex = i + LIGHT_SEQUENCE[sequenceIdx];
                }
                if(litCharacterIndex >=0 && litCharacterIndex < tbActors.length) {
                    lightLevels[tbActors[litCharacterIndex].data._id] = 2;
                }
            }
            for(let powerIdx = 0; powerIdx < emittedLight.dim && sequenceIdx < LIGHT_SEQUENCE.length; powerIdx++, sequenceIdx++) {
                let litCharacterIndex = i + LIGHT_SEQUENCE[sequenceIdx];
                while((litCharacterIndex < 0 || litCharacterIndex >= tbActors.length) && sequenceIdx < LIGHT_SEQUENCE.length) {
                    sequenceIdx += 1;
                    litCharacterIndex = i + LIGHT_SEQUENCE[sequenceIdx];
                }
                if(litCharacterIndex >=0 && litCharacterIndex < tbActors.length) {
                    lightLevels[tbActors[litCharacterIndex].data._id] = Math.max(1, lightLevels[tbActors[litCharacterIndex].data._id]);
                }
            }
        }
        return lightLevels;
    }

    async currentGrind() {
        let theGrind = game.settings.get('grind-sheet', 'theGrind');
        if (!theGrind || theGrind.dataType !== 'grind') {
            return await this.resetGrind();
        }
        return theGrind;
    }

    async resetGrind() {
        if(game.user.isGM) {
            const newGrind = {
                dataType: 'grind',
                turn: 0,
                actors: [],
                ambientLight: 'Bright',
                active: true,
            };
            await this.updateGrind(newGrind, 'resetGrind');
            return newGrind;
        }
    }

    async activateGrind() {
        if(game.user.isGM) {
            await this.updateGrind({active: true}, 'activateGrind');
        }
    }

    async deactivateGrind() {
        if(game.user.isGM) {
            await this.updateGrind({active: false}, 'deactivateGrind');
        }
    }

    async advanceGrind() {
        if(game.user.isGM) {
            const newTurn = this._grindData.grind.turn + 1;
            await this.updateGrind({turn: newTurn}, 'advanceGrind');
            const tbActors = this._grindData.grind.actors.map(id => game.actors.get(id));
            for(let i = 0; i < tbActors.length; i++) {
                await tbActors[i].consumeActiveLightFuel();
            }
            if(newTurn % 4 === 0) {
                for(let i = 0; i < tbActors.length; i++) {
                    await tbActors[i].takeNextGrindCondition();
                }
            }
        }
    }

    async changeLight() {
        switch(this._grindData.grind.ambientLight) {
            case "Dark":
                await this.updateGrind({ambientLight: "Bright"}, 'changeLight');
                break;
            case "Dim":
                await this.updateGrind({ambientLight: "Dark"}, 'changeLight');
                break;
            case "Bright":
                await this.updateGrind({ambientLight: "Dim"}, 'changeLight');
                break;
        }
    }

    async loadChars() {
        if(game.user.isGM) {
            let actorIds = [];
            for(let i = 0; i < game.actors.entities.length; i++) {
                let actor = game.actors.entities[i];
                if(actor.data.type === 'Character') {
                    actorIds.push(actor.data._id);
                }
            }
            await this.updateGrind({actors: actorIds}, 'loadChars');
        }
    }

    async updateGrind(changes, source) {
        if(!game.user.isGM && changes) {
            this.sendMessage({type: "requestGrindChange", source: {name: game.user.name}, changes: changes});
        } else {
            if(changes) {
                if(source !== 'resetGrind') {
                    changes = Object.assign({}, await this.currentGrind(), changes);
                }
                await game.settings.set('grind-sheet', 'theGrind', changes);
            }
            this._hasUpdate = true;
            if(!this._updateSources) this._updateSources = [];
            this._updateSources.push(source);
            this.onUpdate();
            setTimeout(() => {
                if(this._hasUpdate) {
                    this.sendMessage({type: "grindChanged", source: this._updateSources});
                    this._hasUpdate = false;
                    this._updateSources = [];
                }
            }, 1000);
        }
    }

    onUpdate() {
        this.render(false);
    }

    handleMessage(payload) {
        switch(payload.type) {
            case "grindChanged":
                console.log("Informed of grind change");
                console.log(payload);
                this.onUpdate();
                break;
            case "requestGrindChange":
                if(game.user.isGM) {
                    this.updateGrind(payload.changes, payload.source).then(() => this.render());
                }
                break;
            case "claimRequest":
                this.processClaimRequest(payload);
                break;
        }
    }

    sendMessage(payload) {
        game.socket.emit('system.torchbearer', {
            messageType: "grind",
            name: 'the-grind',
            payload: payload
        });
    }

    async lightLevelFor(actorId) {
        if(!this._grindData) {
            console.log("WARN: Looking up lightlevel but Grind not initialized. Initializing.");
            await this.getData();
        }
        const lightLevels = this._grindData.computed.lightLevels;
        if(!lightLevels.hasOwnProperty(actorId)) {
            console.log("WARN: Looking up lightlevel for Actor not in grind; returning Bright");
            return LIGHT_LEVELS.Bright;
        }
        return lightLevels[actorId];
    }
}
Handlebars.registerHelper('renderGrindActor', function(actorId, lightLevels) {
    const tbActor = game.actors.get(actorId);
    const tbData = tbActor.tbData();
    const lightLevel = lightLevels[actorId];
    let nameColor = 'inherit';
    let bgColor = 'inherit';
    switch(lightLevel) {
        case 0:
            nameColor = 'white';
            bgColor = '#191813';
            break;
        case 1:
            bgColor = 'grey';
            break;
    }
    let html = '';
    html +=
        `<li class="grind actor" style="display:flex;align-items: center;background-color: ${bgColor}" data-actor-id="${actorId}">`;

    //Actor name & icon
    html +=
         `<div style="display: flex;align-items: center;flex:1;;color:${nameColor}">
              <div class="actor-image clickable"><img src="${tbActor.img}" title="${tbActor.name}" alt="${tbActor.name}"/></div>
              <div style="flex-basis: 100px;flex-grow:0;display:flex;align-items: center;">
                  <h1 class="actor-name clickable" style="font-family: Souvenir-Medium;">${tbActor.name}</h1>
              </div>
          </div>`;

    //Light summary
    html+=
         `<div style="display:flex;align-items: center;flex:1;padding-left:8px;">`;
    tbData.computed.emittedLight.held.forEach((i) => {
        html += `<img src='systems/torchbearer/assets/icons/items/${i.name.toLowerCase()}.png' title='${i.name}' />`
        for(let consumeIdx = 0; consumeIdx < i.data.lightsource.remaining; consumeIdx++) {
            html +=
                `<a class="item-control item-consume" title="Consume" style="margin-right: 5px;"><i style="${i.data.consumable.iconStyle};" class="fas ${i.data.consumable.icon}"></i></a>`;
        }
    });
    tbData.computed.emittedLight.tossed.forEach((i) => {
        html += `<img src='systems/torchbearer/assets/icons/items/${i.name.toLowerCase()}.png' title='${i.name}' style="border-bottom: 2px solid black;" />`
        for(let consumeIdx = 0; consumeIdx < i.data.lightsource.remaining; consumeIdx++) {
            html +=
                `<a class="item-control item-consume" title="Consume" style="margin-right: 5px;"><i style="${i.data.consumable.iconStyle};" class="fas ${i.data.consumable.icon}"></i></a>`;
        }
    });
    html += `</div>`;

    //Conditions summary
    html+=
        `<div style="display:flex;align-items: center;flex:2;padding-left:8px;">`;
    ['fresh', 'hungryandthirsty', 'angry', 'afraid', 'exhausted', 'injured', 'sick', 'dead'].forEach((condition) => {
        if(tbData[condition]) {
            html += `<img src='systems/torchbearer/assets/icons/conditions/${condition}.png' title='${condition}' />`
        }
    });
    html += `</div>`;

    html += `</li>`;
    return html;
});
