import { TorchbearerCharacterActor, TorchbearerMonsterActor, TorchbearerNPCActor } from "@actor";
import { TorchbearerBaseItem } from "@item";

export const TORCHBEARER = {
  Actor: {
    documentClasses: {
      Character: TorchbearerCharacterActor,
      Monster: TorchbearerMonsterActor,
      NPC: TorchbearerNPCActor,
    },
  },
  Item: {
    documentClass: TorchbearerBaseItem,
  },
};
