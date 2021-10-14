import { TorchbearerCharacterActor, TorchbearerMonsterActor, TorchbearerNPCActor } from "@actor";
import { TorchbearerItem, TorchbearerSpell } from "@item";

export const TORCHBEARER = {
  Actor: {
    documentClasses: {
      Character: TorchbearerCharacterActor,
      Monster: TorchbearerMonsterActor,
      NPC: TorchbearerNPCActor,
    },
  },
  Item: {
    documentClasses: {
      Item: TorchbearerItem,
      Spell: TorchbearerSpell,
    },
  },
};
