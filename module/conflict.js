export class conflictSheet extends Application {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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
    
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

  }
}