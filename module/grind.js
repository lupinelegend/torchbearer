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
            width: 810,
            height: 642,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "setup" }],
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
            console.log(await this.currentGrind());
        });
        html.find('.change-light').on('click', () => {
            this.changeLight();
        });
        html.find('.grind.actor .actor-image, .grind.actor .actor-name').on('click', (evt) => {
            game.actors.get($(evt.target).closest('.grind.actor').data('actorId')).sheet.render(true);
        });
    }

    computePartyChecks(tbActors) {
        let sum = 0;
        for(let i = 0; i < tbActors.length; i++) {
            sum += tbActors[i].tbData().computed.totalChecks;
        }
        return sum;
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
            await this.updateGrind({turn: this._grindData.grind.turn + 1});
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
        // console.log("UpdateGrind");
        // console.log(changes);
        // console.log("/UpdateGrind");
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
}
Handlebars.registerHelper('renderGrindActor', function(actorId, lightLevels) {
    let tbActor = game.actors.get(actorId);
    let lightLevel = lightLevels[actorId];
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
        `<li class="grind actor" style="display:flex;align-items: center" data-actor-id="${actorId}">
          <div style="display: flex;align-items: center;flex:1;background-color: ${bgColor};color:${nameColor}">
              <div class="actor-image clickable"><img src="${tbActor.img}" title="${tbActor.name}" alt="${tbActor.name}"/></div>
              <div style="flex-basis: 100px;flex-grow:0;display:flex;align-items: center;">
                  <h1 class="actor-name clickable" style="font-family: Souvenir-Medium;">${tbActor.name}</h1>
              </div>
          </div>
          <div style="display:flex;align-items: center;flex:1;padding-left:8px;">`;
    tbActor.tbData().computed.emittedLight.held.forEach((i) => {
        html +=
            `<div><object data="systems/torchbearer/assets/images/${i.name.toLowerCase()}.svg" type="image/svg+xml" style="background-color:white;width:24px;flex-grow:0;"></object></div>`;
        for(let consumeIdx = 0; consumeIdx < i.data.lightsource.remaining; consumeIdx++) {
            html +=
                `<a class="item-control item-consume" title="Consume" style="margin-right: 5px;"><i style="${i.data.consumable.iconStyle};" class="fas ${i.data.consumable.icon}"></i></a>`;
        }
    });
    tbActor.tbData().computed.emittedLight.tossed.forEach((i) => {
        html +=
            `<div><object data="systems/torchbearer/assets/images/${i.name.toLowerCase()}.svg" type="image/svg+xml" style="background-color:white;width:24px;flex-grow:0;border-bottom:2px solid black;"></object></div>`;
        for(let consumeIdx = 0; consumeIdx < i.data.lightsource.remaining; consumeIdx++) {
            html +=
                `<a class="item-control item-consume" title="Consume" style="margin-right: 5px;"><i style="${i.data.consumable.iconStyle};" class="fas ${i.data.consumable.icon}"></i></a>`;
        }
    });
    html += `</div>`;
    html += `</li>`;
    return html;
});
