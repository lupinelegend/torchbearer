import { TorchbearerActorSheet } from "./actor-sheet.js";

export class TorchbearerMonsterSheet extends TorchbearerActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "monster"],
      template: "systems/torchbearer/templates/actor/monster-sheet.html.hbs",
    });
  }
}
