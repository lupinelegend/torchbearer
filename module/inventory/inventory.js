import {validateContainers} from "./containerValidator.js";

export function newItemInventory(item) {
    return {
        name: item.data.name,
        capacity: item.data.capacity,
        slots: [],
        holdsBundles: true,
    };
}

let bundleableItem = function (item, container) {
    //is the container bundleable, is the item bundleable,
    // and is the item currently holding anything inside it?
    return container.holdsBundles &&
        item.data.bundleSize > 1 &&
        item.data.slots === item.data.computed.consumedSlots;
};

export function arrangeInventory(items) {
    const inventory = {
        Head: {
            name: "Head",
            capacity: 1,
            holdsBundles: false,
            slots: [],
        },
        "Hands (Worn)": {
            name: "Hands (Worn)",
            capacity: 2,
            holdsBundles: false,
            slots: [],
        },
        "Hands (Carried)": {
            name: "Hands (Carried)",
            capacity: 2,
            holdsBundles: false,
            slots: [],
        },
        Torso: {
            name: "Torso",
            capacity: 3,
            holdsBundles: false,
            slots: [],
        },
        Pocket: {
            name: "Pocket",
            capacity: 1,
            holdsBundles: false,
            slots: [],
        },
        Neck: {
            name: "Neck",
            capacity: 1,
            holdsBundles: false,
            slots: [],
        },
        Feet: {
            name: "Feet",
            capacity: 1,
            holdsBundles: false,
            slots: [],
        },
        Belt: {
            name: "Belt",
            capacity: 3,
            holdsBundles: false,
            slots: [],
        },
        "On Ground": {
            name: "On Ground",
            holdsBundles: false,
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

    //ensure capacity
    Object.keys(inventory).forEach((k) => {
        const sizeCache = {};
        let container = inventory[k];
        if (container.name === "Unknown") {
            container.slots.forEach((i) => {
                inventory["On Ground"].slots.push(i);
            });
            delete inventory[k];
        } else {
            const bundles = {};
            let consumed = 0;
            const removed = [];
            container.slots.forEach((i) => {
                //first, can the item be bundled? if so, do that and exit the rest
                // of the process
                i.data.computed.bundledWith = [];
                if(bundleableItem(i, container)) {
                    if(bundles[i.data.name]) {
                        //Add this item to the bundle and queue it for removal from this inventory slot set
                        bundles[i.data.name].data.computed.bundledWith.push(i);
                        removed.push(i);
                        //if the original item is now bundled with enough items to meet the size, it's
                        // no longer an eligible bundle
                        if(bundles[i.data.name].data.computed.bundledWith.length === i.data.bundleSize - 1) {
                            delete bundles[i.data.name];
                        }
                        //once it's in a bundle we know there's nothing else to do here
                        return;
                    }
                }
                //last, can it be added to the container?
                //if so, great and start the next bundle if possible
                //if not, drop it on the ground
                const size = calculateSize(i, inventory, i.data.equip, sizeCache);
                if ((consumed + size) > container.capacity) {
                    removed.push(i);
                    inventory["On Ground"].slots.push(i);
                    if(bundles[i.data.name]) {
                        delete bundle[i.data.name];
                    }
                } else {
                    consumed += size;
                    if(bundleableItem(i, container)) {
                        bundles[i.data.name] = i;
                    }
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

function calculateSize(item, inventory, targetContainerType, sizeCache) {
    if(item.data.resizes && inventory[item._id] && targetContainerType === 'Pack') {
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

//NOTE This doesn't work when testing against packs, only
// direct carry/worn slots, hence no containerId being passed
export function canFit(tbItem, containerType, inventory) {
    console.log("CAN FIT");
    console.log(tbItem);
    console.log(containerType);
    console.log(inventory);
    if(!containerType || containerType === 'Pack') return true;
    const size = calculateSize(tbItem.data, inventory, containerType, {});
    let container = inventory[containerType];
    console.log("Size " + size);
    console.log("Current consumption " + currentConsumptionExcluding(container, tbItem));
    console.log("Capacity " + container.capacity);
    console.log('CAN FIT DONE');
    return size + currentConsumptionExcluding(container, tbItem) <= container.capacity;
}

let currentConsumptionExcluding = function(container, tbItem) {
    return container.slots.reduce((accum, curr) => {
        if(tbItem && tbItem.data._id === curr._id) {
            return accum;
        }
        return accum + curr.data.computed.consumedSlots;
    }, 0);
}

export function alternateContainerType(tbItem) {
    return tbItem.validContainerTypes().reduce((accum, curr) => {
        if(curr !== tbItem.data.data.equip && curr !== 'Pack' && curr !== '') {
            return curr;
        } else {
            return accum;
        }
    }, '');
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
            let quantityExpression = '';
            if(item.data.computed.bundledWith && item.data.computed.bundledWith.length > 0) {
                quantityExpression = `(${item.data.computed.bundledWith.length + 1})`;
            }
            if(i === 0) {
                html +=
                    `<li class="item flexrow primary-slot-consumed ${inventoryContainerClass} ${lastSlotTakenClass}" data-item-id="${item._id}" data-container-type="${containerType}">
                  <div class="item-image"><img src="${item.img}" title="${item.name}" alt="${item.name}" width="24" height="24"/></div>
                  <h4 class="item-name" style="font-family: Souvenir-Medium;">${item.name} ${quantityExpression}</h4>
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
