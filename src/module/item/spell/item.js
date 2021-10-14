import { TorchbearerBaseItem } from "../base";
import _ from "lodash";

const CIRCLES = ["First", "Second", "Third", "Fourth", "Fifth"];

export class TorchbearerSpell extends TorchbearerBaseItem {
  /**
   * Returns a map from a circle name to all spells in that circle
   */
  static dataByCircle(items) {
    const spells = items.filter(
      (item) => item instanceof TorchbearerSpell && _.includes(CIRCLES, item.data.data.circle)
    );

    return _.groupBy(
      spells.map((spell) => spell.data),
      (spellData) => spellData.data.circle
    );
  }
}
