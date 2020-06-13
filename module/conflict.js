export class conflictSheet extends Application {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Conflict Sheet",
      classes: ["torchbearer", "sheet"],
      template: "systems/torchbearer/templates/conflict-template.html",
      width: 1000,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "setup" }]
    });
  }

  /** @override */
  getData() {
    // https://discordapp.com/channels/170995199584108546/670336275496042502/720685481641246770

    let data = super.getData();
    
    let partyIntent;
    let temp = game.settings.get('conflict-sheet', 'partyIntent');
    if (temp === 'undefined' || temp === '') {
      partyIntent = '';
    } else {
      //partyIntent = JSON.parse(temp);
      partyIntent = temp;
    }

    let opponentIntent;
    temp = game.settings.get('conflict-sheet', 'opponentIntent');
    if (temp === 'undefined' || temp === '') {
      opponentIntent = '';
    } else {
      //opponentIntent = JSON.parse(temp);
      opponentIntent = temp;
    }

    let conflictCaptain;
    temp = game.settings.get('conflict-sheet', 'conflictCaptain');
    if (temp === 'undefined' || temp === '') {
      conflictCaptain = '';
    } else {
      //conflictCaptain = JSON.parse(temp);
      conflictCaptain = temp;
    }

    let opponentName;
    temp = game.settings.get('conflict-sheet', 'opponentName');
    if (temp === 'undefined' || temp === '') {
      opponentName = '';
    } else {
      //opponentName = JSON.parse(temp);
      opponentName = temp;
    }

    let partyDispoCurrent;
    temp = game.settings.get('conflict-sheet', 'partyDispoCurrent');
    if (temp === 'undefined' || temp === '') {
      partyDispoCurrent = '';
    } else {
      //partyDispoCurrent = JSON.parse(temp);
      partyDispoCurrent = temp;
    }

    let partyDispoMax;
    temp = game.settings.get('conflict-sheet', 'partyDispoMax');
    if (temp === 'undefined' || temp === '') {
      partyDispoMax = '';
    } else {
      let temp = game.settings.get('conflict-sheet', 'partyDispoMax');
      //partyDispoMax = JSON.parse(temp);
      partyDispoMax = temp;
    }

    let opponentDispoCurrent;
    temp = game.settings.get('conflict-sheet', 'opponentDispoCurrent');
    if (temp === 'undefined' || temp === '') {
      opponentDispoCurrent = '';
    } else {
      //opponentDispoCurrent = JSON.parse(temp);
      opponentDispoCurrent = temp;
    }

    let opponentDispoMax;
    temp = game.settings.get('conflict-sheet', 'opponentDispoMax');
    if (temp === 'undefined' || temp === '') {
      opponentDispoMax = '';
    } else {
      //opponentDispoMax = JSON.parse(temp);
      opponentDispoMax = temp;
    }

    // Create an array of actor names
    let actorArray = [];
    game.actors._source.forEach(element => {
      if (element.type === 'Character') {
        actorArray.push(element.name);
      }
    });

    // Set template variables
    data.actors = actorArray;
    data.partyIntent = partyIntent;
    data.opponentIntent = opponentIntent;
    data.conflictCaptain = conflictCaptain;
    data.opponentName = opponentName;
    data.partyDispoCurrent = partyDispoCurrent;
    data.partyDispoMax = partyDispoMax;
    data.opponentDispoCurrent = opponentDispoCurrent;
    data.opponentDispoMax = opponentDispoMax;

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('#partyIntent').change(ev => {
      this.updateSheet(ev, 'partyIntent');
    });

    html.find('#opponentIntent').change(ev => {
      this.updateSheet(ev, 'opponentIntent');
    });

    html.find('#conflictCaptain').change(ev => {
      this.updateSheet(ev, 'conflictCaptain');
    });

    html.find('#opponentName').change(ev => {
      this.updateSheet(ev, 'opponentName');
    });

    html.find('#partyDispoCurrent').change(ev => {
      this.updateSheet(ev, 'partyDispoCurrent');
    });

    html.find('#partyDispoMax').change(ev => {
      this.updateSheet(ev, 'partyDispoMax');
    });

    html.find('#opponentDispoCurrent').change(ev => {
      this.updateSheet(ev, 'opponentDispoCurrent');
    });

    html.find('#opponentDispoMax').change(ev => {
      this.updateSheet(ev, 'opponentDispoMax');
    });
  }

  updateSheet(ev, input) {
    if (game.user.isGM) {
      game.settings.set('conflict-sheet', input, ev.currentTarget.value).then( () => {
        this.render(true);
        game.socket.emit('system.torchbearer', {
          name: input,
          payload: ev.currentTarget.value
        });
      });
    } else{
      game.socket.emit('system.torchbearer', {
        name: input,
        payload: ev.currentTarget.value
      });
    }
  }
}