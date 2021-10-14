import { TorchbearerBaseItemSheet } from "../base-sheet";

export class TorchbearerSpellSheet extends TorchbearerBaseItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "spell"],
      template: "systems/torchbearer/templates/item/spell-sheet.html.hbs",
    });
  }
}
