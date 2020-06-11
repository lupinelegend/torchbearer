import {cloneInventory, newItemInventory} from "../inventory/inventory.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class TorchbearerItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;

    data.computed = data.computed || {};
    data.computed.consumedSlots = itemData.data.slots;
    if(data.capacity) {
      if(this.actor && actorData.data.computed.inventory[this._id]) {
        data.computed.inventory = actorData.data.computed.inventory[this._id];
      } else {
        data.computed.inventory = newItemInventory(this);
      }
    }
  }

  isCompatibleContainer(containerType) {
    return this.validContainerTypes().includes(containerType);
  }

  validContainerTypes() {
    return [
      this.data.data.equipOptions.option1.value,
      this.data.data.equipOptions.option2.value,
      this.data.data.equipOptions.option3.value,
    ];
  }

  slotsTaken(containerType) {
    for(let i = 1; i <= 3; i++) {
      if(this.data.data.equipOptions['option' + i].value === containerType) {
        return this.data.data.slotOptions['option' + i].value;
      }
    }
    throw("Invalid slots");
  }
}
