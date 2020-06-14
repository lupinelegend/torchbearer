import {cloneInventory, newItemInventory} from "../inventory/inventory.js";
import {itemExtensions} from "./itemExtensions.js";

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
    let itemExtension = itemExtensions[this.data.name];
    if(itemExtension) {
      for(const functionName in itemExtension) {
        if(itemExtension.hasOwnProperty(functionName)) {
          this[functionName] = itemExtension[functionName].bind(this);
        }
      }
    }
  }

  tbData() {
    return this.data.data;
  }
  
  async syncEquipVariables() {
    let tbData = this.tbData();
    for(let i = 1; i <= 3; i++) {
      if(tbData.equip === tbData.equipOptions['option' + i].value) {
        await this.update({
          data: {
            carried: tbData.carryOptions['option' + i].value,
            slots: tbData.slotOptions['option' + i].value,
          }
        });
        return;
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

  /**
   * Overridable Callback action
   * @param tbItemOther: the other object
   * @param given: array of items that have already been confirmed
   * @return true if ok to add, false if not and make this object unbundleable
   */
  onBeforeBundleWith(tbItemOther, given) {
    return true;
  }
  /**
   * Overridable Callback action
   * @param container: the inventory container being added to
   * @param given: array of items that have already been confirmed
   * @return true if ok to add, false if should be put on ground
   */
  onAfterAddToInventory(container, given) {
    return true;
  }

  /**
   * Overridable Callback action whenever the item is consumed as
   * food or drink
   */
  onAfterConsumed() {
  }

  /**
   * Overridable Callback action
   * @param container: the inventory container being added to
   * @param given: array of items that have already been confirmed
   * @return nothing but can modify data.data.computed.consumedSlots
   */
  onCalculateConsumedSlots(container, given) {
  }
}
