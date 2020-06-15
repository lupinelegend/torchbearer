import {arrangeInventory} from "../inventory/inventory.js";

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

    //if (actorData.type === 'npc') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make a new Object that holds computed data and keeps it separate from anything else
    data.computed = {};
    data.computed.inventory = arrangeInventory(this.items, data.overburdened);
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
  }

  tbData() {
    return this.data.data;
  }
}