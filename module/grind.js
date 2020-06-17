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
        if(game.user.isGM) {
            data.isGM = true;
        }
        data.computed = {};
        data.computed.grindImage = data.grind.turn === 0 ?
            '/systems/torchbearer/assets/icons/grind0.svg' :
            `/systems/torchbearer/assets/icons/grind${data.grind.turn % 4 === 0 ? 4 : data.grind.turn % 4}.svg`;
        this._grindData = data;
        return data;
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
            };
            await this.updateGrind(newGrind, true);
            return newGrind;
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

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('#reloadTemplate').on('click', () => {
            delete(_templateCache[this.options.template]);
            this.render(true);
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
Handlebars.registerHelper('renderGrindActor', function(actorId) {
    let tbActor = game.actors.get(actorId);
    let html = '';
    html +=
        `<li class="grind actor flexrow" data-actor-id="${actorId}">
          <div class="actor-image"><img src="${tbActor.img}" title="${tbActor.name}" alt="${tbActor.name}"/></div>
          <h4 class="actor-name clickable" style="font-family: Souvenir-Medium;">${tbActor.name}</h4>
         </li>`;
    return html;
});
