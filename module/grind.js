export class GrindSheet extends Application {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "Grind Sheet",
            classes: ["torchbearer", "sheet"],
            template: "systems/torchbearer/templates/grind-template.html",
            width: 800,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "setup" }]
        });
    }

    /** @override */
    getData() {
        // https://discordapp.com/channels/170995199584108546/670336275496042502/720685481641246770

        let data = super.getData();

        let theGrind = game.settings.get('grind-sheet', 'theGrind');
        if (theGrind === 'undefined' || theGrind === '') {
            theGrind = {};
        }
        console.log("theGrind data");
        console.log(theGrind);
        console.log("/theGrind data");

        data.grind = theGrind;
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('#test').on('click', () => {
            console.log("Test clicked");
            this.sendMessage({
                message: "Hello World",
            });
        });
    }

    updateGrind(value) {
        if (game.user.isGM) {
            game.settings.set('grind-sheet', 'theGrind', value).then( () => {
                this.render(true);
                game.socket.emit('system.torchbearer', {
                    messageType: "grind",
                    name: 'the-grind',
                    payload: value
                });
            });
        } else{
            game.socket.emit('system.torchbearer', {
                messageType: "grind",
                name: 'the-grind',
                payload: value
            });
        }
    }

    handleMessage(message) {
        console.log("Grind.handleMessage");
        console.log(message);
        console.log("/Grind.handleMessage");
    }

    sendMessage(message) {
        game.socket.emit('system.torchbearer', {
            messageType: "grind",
            name: 'the-grind',
            payload: message
        });
    }
}