import {arrangeInventory} from "./inventory/inventory.js";

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
    data.computed.inventory = arrangeInventory(actorData.items);
  }

  removeItemFromInventory(itemId) {
    const equip = this.getOwnedItem(itemId).data.data.equip;
    const slotsVacated = this.getOwnedItem(itemId).data.data.slots;

    // Add the slots being vacated back to slotsAvailable
    switch (equip) {
      case "Head":
        this.update({'data.Head.wornSlotsAvailable': this.data.data.Head.wornSlotsAvailable + slotsVacated});
        break;
      case "Neck":
        this.update({'data.Neck.wornSlotsAvailable': this.data.data.Neck.wornSlotsAvailable + slotsVacated});
        break;
      case "Hands (Worn)":
        this.update({'data.Hands.wornSlotsAvailable': this.data.data.Hands.wornSlotsAvailable + slotsVacated});
        break;
      case "Hands (Carried)":
        this.update({'data.Hands.carriedSlotsAvailable': this.data.data.Hands.carriedSlotsAvailable + slotsVacated});
        break;
      case "Feet":
        this.update({'data.Feet.wornSlotsAvailable': this.data.data.Feet.wornSlotsAvailable + slotsVacated});
        break;
      case "Torso":
        this.update({'data.Torso.wornSlotsAvailable': this.data.data.Torso.wornSlotsAvailable + slotsVacated});
        break;
      case "Belt":
        this.update({'data.Belt.packSlotsAvailable': this.data.data.Belt.packSlotsAvailable + slotsVacated});
        break;
    }

    // Delete the item
    this.deleteOwnedItem(itemId);
  }
}