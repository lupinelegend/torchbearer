import { TorchbearerBaseActorSheet } from "../base-sheet";

export class TorchbearerMonsterSheet extends TorchbearerBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "monster"],
      template: "systems/torchbearer/templates/actor/monster-sheet.html.hbs",
    });
  }
}
