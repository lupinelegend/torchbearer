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
        html.find('.grind.actor .actor-image, .grind.actor .actor-name').on('click', (evt) => {
            game.actors.get($(evt.target).closest('.grind.actor').data('actorId')).sheet.render(true);
        });
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
            await this.updateGrind({actors: newActors});
        } else {
            await this.updateGrind({actors: sortUpdates.map(entry => entry.target.data._id)});
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
        let total = 0;
        for(let i = 0; i < tbActors.length; i++) {
            const container = tbActors[i].tbData().computed.inventory['On Ground'];
            if(container.slots.length > 0) {
                catalog.push({
                    _actor_id: container.slots[0]._actor_id,
                    container: container
                });
                total += container.slots.length;
            }
        }
        return {
            total: total,
            catalog: catalog,
        };
    }

    computeLightLevels(ambientLight, tbActors) {
        const LIGHT_SEQUENCE = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
        let lightLevels = {};
        for(let i = 0; i < tbActors.length; i++) {
            lightLevels[tbActors[i]._id] = LIGHT_LEVELS[ambientLight];
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
                    lightLevels[tbActors[litCharacterIndex]._id] = 2;
                }
            }
            for(let powerIdx = 0; powerIdx < emittedLight.dim && sequenceIdx < LIGHT_SEQUENCE.length; powerIdx++, sequenceIdx++) {
                let litCharacterIndex = i + LIGHT_SEQUENCE[sequenceIdx];
                while((litCharacterIndex < 0 || litCharacterIndex >= tbActors.length) && sequenceIdx < LIGHT_SEQUENCE.length) {
                    sequenceIdx += 1;
                    litCharacterIndex = i + LIGHT_SEQUENCE[sequenceIdx];
                }
                if(litCharacterIndex >=0 && litCharacterIndex < tbActors.length) {
                    lightLevels[tbActors[litCharacterIndex]._id] = Math.max(1, lightLevels[tbActors[litCharacterIndex]._id]);
                }
            }
        }
        return lightLevels;
    }

    async currentGrind() {
        let theGrind = game.settings.get('grind-sheet', 'theGrind');
        if (theGrind === 'undefined' || theGrind === '' || theGrind.dataType !== 'grind') {
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
            await this.updateGrind(newGrind, true);
            return newGrind;
        }
    }

    async activateGrind() {
        if(game.user.isGM) {
            await this.updateGrind({active: true});
        }
    }

    async deactivateGrind() {
        if(game.user.isGM) {
            await this.updateGrind({active: false});
        }
    }

    async advanceGrind() {
        if(game.user.isGM) {
            const newTurn = this._grindData.grind.turn + 1;
            await this.updateGrind({turn: newTurn});
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
                await this.updateGrind({ambientLight: "Bright"});
                break;
            case "Dim":
                await this.updateGrind({ambientLight: "Dark"});
                break;
            case "Bright":
                await this.updateGrind({ambientLight: "Dim"});
                break;
        }
    }

    async loadChars() {
        if(game.user.isGM) {
            let actorIds = [];
            for(let i = 0; i < game.actors.entities.length; i++) {
                let actor = game.actors.entities[i];
                if(actor.data.type === 'Character') {
                    actorIds.push(actor._id);
                }
            }
            await this.updateGrind({actors: actorIds});
        }
    }

    async updateGrind(changes, override) {
        if(!override) {
            changes = Object.assign({}, await this.currentGrind(), changes);
        }
        await game.settings.set('grind-sheet', 'theGrind', changes);
        setTimeout(() => {
            this.sendMessage("grindChanged");
            this.onUpdate();
        }, 0);
    }

    onUpdate() {
        this.render(false);
    }

    handleMessage(message) {
        switch(message) {
            case "grindChanged":
                this.onUpdate();
                break;
        }
    }

    sendMessage(message) {
        game.socket.emit('system.torchbearer', {
            messageType: "grind",
            name: 'the-grind',
            payload: message
        });
    }

    async lightLevelFor(actorId) {
        if(!this._grindData) {
            console.log("WARN: Looking up lightlevel but Grind not initialized. Initializing.");
            await this.getData();
        }
        const lightLevels = this._grindData.computed.lightLevels;
        if(!lightLevels[actorId]) {
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
