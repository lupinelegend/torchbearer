import { TorchbearerActorSheet } from "./actor-sheet.js";

export class TorchbearerNPCSheet extends TorchbearerActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "npc"],
      template: "systems/torchbearer/templates/actor/npc-sheet.html.hbs",
    });
  }
}
