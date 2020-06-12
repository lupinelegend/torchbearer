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
    
    let partyIntent = '';
    let temp = game.settings.get('conflict-sheet', 'partyIntent');
    partyIntent = JSON.parse(temp);

    let opponentIntent = '';
    temp = game.settings.get('conflict-sheet', 'opponentIntent');
    opponentIntent = JSON.parse(temp);

    let conflictCaptain = '';
    temp = game.settings.get('conflict-sheet', 'conflictCaptain');
    conflictCaptain = JSON.parse(temp);

    let opponentName = '';
    temp = game.settings.get('conflict-sheet', 'opponentName');
    opponentName = JSON.parse(temp);

    let partyDispoCurrent = '';
    temp = game.settings.get('conflict-sheet', 'partyDispoCurrent');
    partyDispoCurrent = JSON.parse(temp);

    let partyDispoMax = '';
    temp = game.settings.get('conflict-sheet', 'partyDispoMax');
    partyDispoMax = JSON.parse(temp);

    let opponentDispoCurrent = '';
    temp = game.settings.get('conflict-sheet', 'opponentDispoCurrent');
    opponentDispoCurrent = JSON.parse(temp);

    let opponentDispoMax = '';
    temp = game.settings.get('conflict-sheet', 'opponentDispoMax');
    opponentDispoMax = JSON.parse(temp);


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
      game.settings.set('conflict-sheet', 'partyIntent', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#opponentIntent').change(ev => {
      game.settings.set('conflict-sheet', 'opponentIntent', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#conflictCaptain').change(ev => {
      game.settings.set('conflict-sheet', 'conflictCaptain', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#opponentName').change(ev => {
      game.settings.set('conflict-sheet', 'opponentName', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#partyDispoCurrent').change(ev => {
      game.settings.set('conflict-sheet', 'partyDispoCurrent', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#partyDispoMax').change(ev => {
      game.settings.set('conflict-sheet', 'partyDispoMax', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#opponentDispoCurrent').change(ev => {
      game.settings.set('conflict-sheet', 'opponentDispoCurrent', JSON.stringify(ev.currentTarget.value));
    });

    html.find('#opponentDispoMax').change(ev => {
      game.settings.set('conflict-sheet', 'opponentDispoMax', JSON.stringify(ev.currentTarget.value));
    });
  }
}