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
    };

    items.forEach((item) => {
      if(item.data.equip === "Pack") {
        if(!item.data.containerId) {
          console.error("Could not find container for ", JSON.stringify(item.data));
        } else {
          if(!inventory[item.data.containerId]) {
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
        console.error("Could not find inventory location for ", JSON.stringify(item.data));
      }
    });
    return inventory;
  }
}