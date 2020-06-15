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
    let storedActorArray = game.settings.get('conflict-sheet', 'actorArray');
    console.log(storedActorArray);
    let actorArray = [];
    game.actors._source.forEach((element, index) => {
      if (element.type === 'Character') {
        let char = {
          name: element.name,
          equipped: '',
          weapons: [],
          index: index
        }
        let i = 0;
        let weaponArray = [];
        while (i < element.items.length) {
          weaponArray.push(element.items[i]);
          i++;
        }
        char.weapons = weaponArray;
        actorArray.push(char);
      }
    });
    game.settings.set('conflict-sheet', 'actorArray', actorArray);
    console.log(actorArray);

    // let storedActorArray = game.settings.get('conflict-sheet', 'actorArray');
    // storedActorArray.forEach((element, index) => {
    //   actorArray.forEach((subElement, subIndex) => {
    //     if (element.name === subElement.name) {
    //       console.log(element);
    //       console.log(subElement);
    //       //element.equipped = subElement.equipped;
    //     }
    //   });
    // });

    // Create an array of weapons

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
      this.updateSheet(ev.currentTarget.value, 'partyIntent');
    });

    html.find('#opponentIntent').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'opponentIntent');
    });

    html.find('#conflictCaptain').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'conflictCaptain');
    });

    html.find('#opponentName').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'opponentName');
    });

    html.find('#partyDispoCurrent').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'partyDispoCurrent');
    });

    html.find('#partyDispoMax').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'partyDispoMax');
    });

    html.find('#opponentDispoCurrent').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'opponentDispoCurrent');
    });

    html.find('#opponentDispoMax').change(ev => {
      this.updateSheet(ev.currentTarget.value, 'opponentDispoMax');
    });

    html.find('.charWeapon').change(ev => {
      
      // Get actor name
      let len = 0;
      for (let i = 0; i < ev.currentTarget.id.length; i++) {
        if (ev.currentTarget.id.charAt(i) === '-') {
          len = i;
        }
      }
      let actorName = ev.currentTarget.id.slice(0,len);

      // Get actor object
      let actorArray = game.settings.get('conflict-sheet', 'actorArray');
      console.log(actorArray[0]);
      let actorIndex;
      actorArray[0].forEach((element, index) => {
        console.log(element);
        if (actorName === element.name) {
          actorIndex = index;
        }
      });
      actorArray[0][actorIndex].equipped = ev.currentTarget.value;
      console.log(actorArray);
      game.settings.set('conflict-sheet', 'actorArray', actorArray);
      //this.updateSheet(actorArray, 'actorArray');
    });
  }

  updateSheet(value, input) {
    if (game.user.isGM) {
      game.settings.set('conflict-sheet', input, value).then( () => {
        this.render(true);
        game.socket.emit('system.torchbearer', {
          name: input,
          payload: value
        });
      });
    } else{
      game.socket.emit('system.torchbearer', {
        name: input,
        payload: value
      });
    }
  }
}