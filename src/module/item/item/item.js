import { TorchbearerBaseItem } from "../base";

import { itemExtensions } from "../itemExtensions";

export class TorchbearerItem extends TorchbearerBaseItem {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
    // Get the Item's data
    const itemData = this.data;
    const data = itemData.data;

    data.computed ??= {};
    data.computed.consumedSlots = itemData.data.slots;
    let itemExtension = itemExtensions[this.data.name];
    if (itemExtension) {
      for (const functionName in itemExtension) {
        if (Object.prototype.hasOwnProperty.call(itemExtension, functionName)) {
          this[functionName] = itemExtension[functionName].bind(this);
        }
      }
    }
  }

  async syncEquipVariables() {
    let tbData = this.tbData();
    for (let i = 1; i <= 3; i++) {
      if (tbData.equip === tbData.equipOptions["option" + i].value) {
        await this.update({
          data: {
            carried: tbData.carryOptions["option" + i].value,
            slots: tbData.slotOptions["option" + i].value,
          },
        });
        return;
      }
    }
  }

  async consumeOne() {
    if (!this.actor) {
      return false;
    }

    if (!this.onBeforeConsumed()) {
      return false;
    }

    let update;
    const tbData = this.tbData();
    if (tbData.consumable.consumes === "draughts") {
      update = this.update({
        data: {
          draughts: Math.clamped(tbData.draughts - 1, 0, 10),
        },
      });
    } else if (tbData.consumable.consumes === "self") {
      update = this.actor.removeItemFromInventory(this.data._id);
    } else if (tbData.consumable.consumes === "light") {
      update = this.update({
        data: {
          lightsource: {
            remaining: Math.clamped(tbData.lightsource.remaining - 1, 0, 10),
          },
        },
      });
    }
    await update;
    await this.onAfterConsumed();
    return true;
  }

  /*
   * @return Whether the item successfully toggled
   */
  async toggleActive() {
    if (!this.actor) return false;
    const tbData = this.tbData();
    if (!tbData.activatable.activates) return false;
    if (!this.onBeforeActivate()) return false;
    await this.update({
      data: {
        activatable: {
          active: !tbData.activatable.active,
        },
      },
    });
    return true;
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
    for (let i = 1; i <= 3; i++) {
      if (this.data.data.equipOptions["option" + i].value === containerType) {
        return this.data.data.slotOptions["option" + i].value;
      }
    }
    throw "Invalid slots";
  }
}
