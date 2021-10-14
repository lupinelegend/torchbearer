import { TorchbearerBaseActor } from "../base";
import { TorchbearerSpell } from "@item";
import { arrangeInventory } from "@inventory/inventory";

const GRIND_CONDITION_SEQUENCE = ["hungryandthirsty", "exhausted", "angry", "sick", "injured", "afraid", "dead"];

export class TorchbearerCharacterActor extends TorchbearerBaseActor {
  prepareData() {
    super.prepareData();

    const data = this.data.data;

    // Make a new Object that holds computed data and keeps it separate from anything else
    data.computed = {};

    data.computed.spellData = TorchbearerSpell.dataByCircle(this.items);

    data.computed.inventory = arrangeInventory(this.items, data.overburdened);
    //The first time this is executed, Actors don't have their items yet, so there is
    // no inventory
    if (data.computed.inventory) {
      data.computed.emittedLight = this.calculateEmittedLight(data.computed.inventory);
    }

    let trait1Checks = parseInt(data.traits.trait1.checks.checksEarned) || 0;
    let trait2Checks = parseInt(data.traits.trait2.checks.checksEarned) || 0;
    let trait3Checks = parseInt(data.traits.trait3.checks.checksEarned) || 0;
    let trait4Checks = parseInt(data.traits.trait4.checks.checksEarned) || 0;
    data.computed.totalChecks = trait1Checks + trait2Checks + trait3Checks + trait4Checks;
  }

  _determineDumpTarget(tbItem, recursions = 0) {
    let container =
      (tbItem.tbData().containerId
        ? this.tbData().computed.inventory[tbItem.tbData().containerId]
        : this.tbData().computed.inventory[tbItem.tbData().equip]) || {};
    if (container.name === "Cached") {
      return { dumpEquip: "Cached", dumpCarried: "Cached" };
    }
    if (container.name === "Lost") {
      return { dumpEquip: "Lost", dumpCarried: "Lost" };
    }
    if (container.type === "Pack") {
      let containerTbItem = this.items.get(tbItem.tbData().containerId);
      if (!containerTbItem || recursions >= 20) {
        return { dumpEquip: "On Ground", dumpCarried: "Ground" };
      }
      return this._determineDumpTarget(containerTbItem, recursions + 1);
    }
    return { dumpEquip: "On Ground", dumpCarried: "Ground" };
  }

  async _dumpContents(tbItem) {
    let { dumpEquip, dumpCarried } = this._determineDumpTarget(tbItem);
    let slots = this.tbData().computed.inventory[tbItem.data._id].slots;
    for (let i = 0; i < slots.length; i++) {
      let tbContainedItem = this.items.get(slots[i].data._id);
      if (tbContainedItem) {
        await tbContainedItem.update({
          data: {
            equip: dumpEquip,
            carried: dumpCarried,
            slots: 1,
            containerId: "",
          },
        });
      }
    }
  }

  async removeItemFromInventory(itemId) {
    let inventoryContainer = this.tbData().computed.inventory[itemId];
    if (inventoryContainer && inventoryContainer.slots.length > 0) {
      const tbItem = this.items.get(itemId);
      if (tbItem) {
        await this._dumpContents(tbItem);
      }
    }
    await this.deleteEmbeddedDocuments("Item", [itemId]);
    this._onUpdate({ items: true }, { render: true });
  }

  async takeNextGrindCondition() {
    const tbData = this.tbData();
    for (let i = 0; i < GRIND_CONDITION_SEQUENCE.length; i++) {
      if (!tbData[GRIND_CONDITION_SEQUENCE[i]]) {
        await this.update({
          data: {
            fresh: false,
            [GRIND_CONDITION_SEQUENCE[i]]: true,
          },
        });
        return;
      }
    }
  }

  async consumeActiveLightFuel() {
    const emittedLight = this.calculateEmittedLight(this.tbData().computed.inventory);
    const sources = [].concat(emittedLight.held).concat(emittedLight.tossed);
    if (!sources.length) return;

    for (let i = 0; i < sources.length; i++) {
      const tbItem = this.items.get(sources[i].data._id);
      await tbItem.consumeOne();
    }
    setTimeout(() => {
      this._onUpdate({ items: true }, { render: true });
    }, 0);
  }

  calculateEmittedLight(inventory) {
    let emittedLight = {
      characters: 0,
      dim: 0,
      held: [],
      tossed: [],
    };
    let heldItems = inventory["Hands (Carried)"].slots;
    for (let i = 0; i < heldItems.length; i++) {
      let item = heldItems[i];
      if (item.data.lightsource.remaining && item.data.activatable.active) {
        emittedLight.held.push(item);
        emittedLight.characters += item.data.lightsource.held.characters;
        emittedLight.dim += item.data.lightsource.held.dimCharacters;
      }
    }
    let groundItems = inventory["On Ground"].slots;
    for (let i = 0; i < groundItems.length; i++) {
      let item = groundItems[i];
      if (item.data.lightsource.remaining && item.data.activatable.active) {
        emittedLight.tossed.push(item);
        emittedLight.characters += item.data.lightsource.tossed.characters;
        emittedLight.dim += item.data.lightsource.tossed.dimCharacters;
      }
    }
    return emittedLight;
  }

  getTraitNames() {
    return Object.values(this.tbData().traits)
      .map((t) => t.name)
      .filter((n) => n !== "");
  }

  getNatureDescriptors() {
    return this.tbData().natureDescriptors.split(", ");
  }

  getRating(skillOrAbility) {
    let ability = this.tbData()[skillOrAbility.toLowerCase()];
    if (ability) {
      return ability.value;
    } else if (this.tbData().skills[skillOrAbility]) {
      return this.tbData().skills[skillOrAbility].rating;
    } else {
      console.log("Couldn't find skillOrAbility rating for " + skillOrAbility);
      return 0;
    }
  }

  async getLightLevel() {
    return await game.grind.lightLevelFor(this.data._id);
  }
}
