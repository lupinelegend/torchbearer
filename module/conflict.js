export class conflictSheet extends Application {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: "systems/torchbearer/templates/conflict-template.html",
      width: 300,
      height: 450
    });
  }

  /** @override */
  getData() {
    
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

  }

}