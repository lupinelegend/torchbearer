import { TorchbearerCharacterSheet } from "../character";

export class TorchbearerNPCSheet extends TorchbearerCharacterSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "npc"],
    });
  }
}
