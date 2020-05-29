/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
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
    data.computed.inventory = this.arrangeInventory(actorData.items);
  }

  arrangeInventory(items) {
    const inventory = {
      Head: {
        name: "Head",
        container: null,
        slots: [],
      },
      "Hands (Worn)": {
        name: "Hands (Worn)",
        container: null,
        slots: [],
      },
      "Hands (Carried)": {
        name: "Hands (Carried)",
        container: null,
        slots: [],
      },
      Torso: {
        name: "Torso",
        container: null,
        slots: [],
      },
      Pocket: {
        name: "Pocket",
        container: null,
        slots: [],
      },
      Neck: {
        name: "Neck",
        container: null,
        slots: [],
      },
      Feet: {
        name: "Feet",
        container: null,
        slots: [],
      },
      Belt: {
        name: "Belt",
        container: null,
        slots: [],
      },
      "On Ground": {
        name: "On Ground",
        container: null,
        slots: [],
      }
    };

    items.forEach((item) => {
      if(item.data.equip === "Pack" || item.data.equip === "Quiver") {
        if (!item.data.containerId) {
          inventory["On Ground"].slots.push(item);
        } else {
          if (!inventory[item.data.containerId]) {
            inventory[item.data.containerId] = {
              name: "Unknown",
              container: null,
              slots: [],
            }
          }
          inventory[item.data.containerId].slots.push(item);
        }
      } else if(inventory[item.data.equip]) {
        inventory[item.data.equip].slots.push(item);
        if(item.data.capacity) {
          if(inventory[item._id]) {
            inventory[item._id].name = item.data.name;
            inventory[item._id].container = item;
          } else {
            inventory[item._id] = {
              name: item.data.name,
              container: item,
              slots: [],
            }
          }
        }
      } else {
        inventory["On Ground"].slots.push(item);
      }
    });
    Object.keys(inventory).forEach((k) => {
      if(inventory[k].name === "Unknown") {
        inventory[k].slots.forEach((i) => {
          inventory["On Ground"].slots.push(i);
        });
        delete inventory[k];
      }
    });
    return inventory;
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