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

    if (game.settings.get('conflict-sheet', 'partyIntent') != '') {
      let temp = game.settings.get('conflict-sheet', 'partyIntent');
      partyIntent = JSON.parse(temp);
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

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('#partyIntent').change(ev => {
      game.settings.set('conflict-sheet', 'partyIntent', JSON.stringify(ev.currentTarget.value));
    });
  }
}