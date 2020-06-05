import {validateContainers} from "./containerValidator.js";

export function newItemInventory(item) {
    return {
        name: item.data.name,
        capacity: item.data.capacity,
        slots: [],
    };
}

export function arrangeInventory(items) {
    const inventory = {
        Head: {
            name: "Head",
            capacity: 1,
            slots: [],
        },
        "Hands (Worn)": {
            name: "Hands (Worn)",
            capacity: 2,
            slots: [],
        },
        "Hands (Carried)": {
            name: "Hands (Carried)",
            capacity: 2,
            slots: [],
        },
        Torso: {
            name: "Torso",
            capacity: 3,
            slots: [],
        },
        Pocket: {
            name: "Pocket",
            capacity: 1,
            slots: [],
        },
        Neck: {
            name: "Neck",
            capacity: 1,
            slots: [],
        },
        Feet: {
            name: "Feet",
            capacity: 1,
            slots: [],
        },
        Belt: {
            name: "Belt",
            capacity: 3,
            slots: [],
        },
        "On Ground": {
            name: "On Ground",
            slots: [],
        }
    };

    //Create an "inventory section" for any containers
    // in the actor's possession
    items.forEach((item) => {
        if (item.data.capacity) {
            inventory[item._id] = newItemInventory(item)
        }
    });
    //Assign each item to it's inventory section, either
    // in a base inventory section, inside of another container's
    // inventory section, or on the ground if it's somehow gotten
    // disconnected from those places
    items.forEach((item) => {
        if (item.data.containerId && inventory[item.data.containerId]) {
            inventory[item.data.containerId].slots.push(item);
        } else if (inventory[item.data.equip]) {
            inventory[item.data.equip].slots.push(item);
        } else {
            inventory["On Ground"].slots.push(item);
        }
    });

    //Validate that no containers refer to each other as parents
    validateContainers(inventory);

    Object.keys(inventory).forEach((k) => {
        const sizeCache = {};
        let container = inventory[k];
        if (container.name === "Unknown") {
            container.slots.forEach((i) => {
                inventory["On Ground"].slots.push(i);
            });
            delete inventory[k];
        } else {
            let consumed = 0;
            const removed = [];
            container.slots.forEach((i) => {
                const size = calculateSize(i, inventory, sizeCache);
                if ((consumed + size) > container.capacity) {
                    removed.push(i);
                    inventory["On Ground"].slots.push(i);
                } else {
                    consumed += size;
                }
            });
            if (removed.length) {
                container.slots = container.slots.filter((item) => {
                    return !removed.includes(item);
                })
            }
        }
    });
    return inventory;
}

function calculateSize(item, inventory, sizeCache) {
    if(item.data.resizes && inventory[item._id] && item.data.equip === 'Pack') {
        if(sizeCache[item._id]) {
            return sizeCache[item._id];
        }
        let computedSlots = item.data.slots;
        inventory[item._id].slots.forEach((containedItem) => {
            computedSlots += calculateSize(containedItem, inventory, sizeCache);
        });
        item.data.computed.consumedSlots = computedSlots;
        sizeCache[item._id] = computedSlots;
    }
    return item.data.computed.consumedSlots;
}

export function cloneInventory(inventory) {
    const cloned = newItemInventory(inventory);
    cloned.slots = [].concat(inventory.slots);
    return cloned;
}

export function isCompatibleContainer(item, containerType) {
    return [
        item.data.data.equipOptions.option1.value,
        item.data.data.equipOptions.option2.value,
        item.data.data.equipOptions.option3.value,
    ].includes(containerType);
}
Handlebars.registerHelper('renderInventory', function(capacity, inventory, placeholder, multiSlot) {
    let html = "";
    let consumed = 0;
    inventory.slots.forEach((item) => {
        consumed += item.data.computed.consumedSlots;
        for (let i = 0; i < item.data.computed.consumedSlots; i++) {
            let inventoryContainerClass = '';
            let containerType = '';
            let lastSlotTakenClass = '';
            if(item.data.capacity) {
                inventoryContainerClass = 'inventory-container';
                containerType = 'Pack';
            }
            if(multiSlot === false || i === item.data.computed.consumedSlots - 1) {
                lastSlotTakenClass = 'last-slot-taken';
            }
            if(i === 0) {
                html +=
                    `<li class="item flexrow primary-slot-consumed ${inventoryContainerClass} ${lastSlotTakenClass}" data-item-id="${item._id}" data-container-type="${containerType}">
                  <div class="item-image"><img src="${item.img}" title="${item.name}" alt="${item.name}" width="24" height="24"/></div>
                  <h4 class="item-name" style="font-family: Souvenir-Medium;">${item.name}</h4>
                  <div class="item-controls">
                      <a class="item-control item-edit" title="Edit Item" style="margin-right: 5px;"><i class="fas fa-edit"></i></a>
                      <a class="item-control item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
                  </div>
              </li>`;
            } else if (multiSlot !== false) {
                html +=
                    `<li class="item flexrow secondary-slot-consumed ${inventoryContainerClass} ${lastSlotTakenClass}" data-item-id="${item._id}" data-container-type="${containerType}">
                  <div class="item-image" style="width:24px;height:24px"></div>
                  <h4 class="item-name" style="font-family: Souvenir-Medium;"></h4>
              </li>`;
            }
        }
    });
    for(let i = consumed; i < capacity; i++) {
        html +=
            `<li class="flexrow placeholder">
              <h4 class="item-name" style="font-family: Souvenir-Medium;">[${placeholder}]</h4>
          </li>`;
    }
    return html;
});
