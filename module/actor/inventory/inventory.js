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
                const size = calculateSize(i);
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

function calculateSize(item) {
    if(!item.data.resizes) {
        return item.data.slots;
    } else {
        //TODO handle resizes
        return item.data.slots;
    }
}

export function cloneInventory(inventory) {
    const cloned = newItemInventory(inventory);
    cloned.slots = [].concat(inventory.slots);
    return cloned;
}