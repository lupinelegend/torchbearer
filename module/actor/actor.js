import {arrangeInventory} from "../inventory/inventory.js";
import {arrangeSpells} from "../inventory/inventory.js";

const GRIND_CONDITION_SEQUENCE = ['hungryandthirsty', 'exhausted', 'angry', 'sick', 'injured', 'afraid', 'dead'];

export class TorchbearerActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'Character') this._prepareCharacterData(actorData);

    if (actorData.type === 'NPC') this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make a new Object that holds computed data and keeps it separate from anything else
    data.computed = {};
    
    data.computed.spells = arrangeSpells(this.items);

    data.computed.inventory = arrangeInventory(this.items, data.overburdened);
    //The first time this is executed, Actors don't have their items yet, so there is
    // no inventory
    if(data.computed.inventory) {
      data.computed.emittedLight = this.calculateEmittedLight(data.computed.inventory);
    }

    let trait1Checks = parseInt(data.traits.trait1.checks.checksEarned);
    let trait2Checks = parseInt(data.traits.trait2.checks.checksEarned);
    let trait3Checks = parseInt(data.traits.trait3.checks.checksEarned);
    let trait4Checks = parseInt(data.traits.trait4.checks.checksEarned);
    data.computed.totalChecks = trait1Checks + trait2Checks + trait3Checks + trait4Checks;
  }

  //TODO replace this once an actual NPC sheet is done
  _prepareNpcData(actorData) {
    const data = actorData.data;

    // Make a new Object that holds computed data and keeps it separate from anything else
    data.computed = {};
    data.computed.inventory = arrangeInventory(this.items, data.overburdened);
  }

  _onUpdate(data, options, userId, context) {
    super._onUpdate(data, options, userId, context);
    game.grind.updateGrind(null, 'actor._onUpdate');
  }

  _determineDumpTarget(tbItem, recursions = 0) {
    let container = (tbItem.tbData().containerId
        ? this.tbData().computed.inventory[tbItem.tbData().containerId]
        : this.tbData().computed.inventory[tbItem.tbData().equip]) || {};
    if(container.name === 'Cached') {
      return {dumpEquip: "Cached", dumpCarried: "Cached"}
    }
    if(container.name === 'Lost') {
      return {dumpEquip: "Lost", dumpCarried: "Lost"}
    }
    if(container.type === 'Pack') {
      let containerTbItem = this.items.get(tbItem.tbData().containerId);
      if(!containerTbItem || recursions >= 20) {
        return {dumpEquip: "On Ground", dumpCarried: "Ground"};
      }
      return this._determineDumpTarget(containerTbItem, recursions + 1);
    }
    return {dumpEquip: "On Ground", dumpCarried: "Ground"};
  }

  async _dumpContents(tbItem) {
    let {dumpEquip, dumpCarried} = this._determineDumpTarget(tbItem);
    let slots = this.tbData().computed.inventory[tbItem._id].slots;
    for(let i = 0; i < slots.length; i++) {
      let tbContainedItem = this.items.get(slots[i]._id);
      if(tbContainedItem) {
        await tbContainedItem.update({
          data: {
            equip: dumpEquip,
            carried: dumpCarried,
            slots: 1,
            containerId: '',
          }
        });
      }
    }
  }

  async removeItemFromInventory(itemId) {
    let inventoryContainer = this.tbData().computed.inventory[itemId];
    if(inventoryContainer && inventoryContainer.slots.length > 0) {
      const tbItem = this.items.get(itemId);
      if(tbItem) {
        await this._dumpContents(tbItem);
      }
    }
    await this.deleteOwnedItem(itemId);
    this._onUpdate({items: true});
  }

  async takeNextGrindCondition() {
    const tbData = this.tbData();
    for(let i = 0; i < GRIND_CONDITION_SEQUENCE.length; i++) {
      if(!tbData[GRIND_CONDITION_SEQUENCE[i]]) {
        await this.update({
          data: {
            fresh: false,
            [GRIND_CONDITION_SEQUENCE[i]]: true,
          }
        });
        return;
      }
    }
  }

  async consumeActiveLightFuel() {
    const emittedLight = this.calculateEmittedLight(this.tbData().computed.inventory);
    const sources = [].concat(emittedLight.held).concat(emittedLight.tossed);
    if(!sources.length) return;

    for(let i = 0; i < sources.length; i++) {
      const tbItem = this.getOwnedItem(sources[i]._id);
      await tbItem.consumeOne();
    }
    setTimeout(() => {
      this._onUpdate({items: true});
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
    for(let i = 0; i < heldItems.length; i++) {
      let item = heldItems[i];
      if(item.data.lightsource.remaining && item.data.activatable.active) {
        emittedLight.held.push(item);
        emittedLight.characters += item.data.lightsource.held.characters;
        emittedLight.dim += item.data.lightsource.held.dimCharacters;
      }
    }
    let groundItems = inventory["On Ground"].slots;
    for(let i = 0; i < groundItems.length; i++) {
      let item = groundItems[i];
      if(item.data.lightsource.remaining && item.data.activatable.active) {
        emittedLight.tossed.push(item);
        emittedLight.characters += item.data.lightsource.tossed.characters;
        emittedLight.dim += item.data.lightsource.tossed.dimCharacters;
      }
    }
    return emittedLight;
  }

  tbData() {
    return this.data.data;
  }
}