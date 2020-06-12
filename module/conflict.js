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

  // safeParse(maybeJSON) {
  //   return maybeJSON && maybeJSON !== 'undefined' ? JSON.parse(maybeJSON) : '';
  // }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('#partyIntent').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'partyIntent', ev.currentTarget.value);
      } else{
        game.socket.emit('system.torchbearer', {
          name: 'partyIntent',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#opponentIntent').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'opponentIntent', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'opponentIntent',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#conflictCaptain').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'conflictCaptain', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'conflictCaptain',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#opponentName').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'opponentName', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'opponentName',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#partyDispoCurrent').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'partyDispoCurrent', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'partyDispoCurrent',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#partyDispoMax').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'partyDispoMax', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'partyDispoMax',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#opponentDispoCurrent').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'opponentDispoCurrent', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'opponentDispoCurrent',
          payload: ev.currentTarget.value
        });
      }
    });

    html.find('#opponentDispoMax').change(ev => {
      if (game.user.isGM) {
        game.settings.set('conflict-sheet', 'opponentDispoMax', ev.currentTarget.value);
      } else{
        game.socket.emit(game.settings, {
          name: 'opponentDispoMax',
          payload: ev.currentTarget.value
        });
      }
    });
  }
}