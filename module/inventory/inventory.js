import {validateContainers} from "./containerValidator.js";

export function newItemInventory(tbItem) {
    return {
        name: tbItem.data.data.name,
        capacity: tbItem.data.data.capacity,
        slots: [],
        holdsBundles: true,
        type: 'Pack',
    };
}

let bundleableItem = function (tbItem, container, itemOwnInventory) {
    //is the container bundleable, is the item bundleable,
    // and is the item currently holding anything inside it?
    return container.holdsBundles &&
        tbItem.tbData().bundleSize > 1 &&
        (!itemOwnInventory || itemOwnInventory.slots.length === 0);
        // tbItem.tbData().slots === tbItem.tbData().computed.consumedSlots;
};

export function arrangeInventory(tbItemsMap, overburdened) {
    //For the most part just arrange item data not
    // TorchbearerItem objects...is this necessary?
    if(!tbItemsMap) return;
    const tbItems = [];
    for(const tbItem of tbItemsMap) {
        tbItems.push(tbItem);
    }
    const inventory = {
        Head: {
            name: "Head",
            capacity: 1,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        "Hands (Worn)": {
            name: "Hands (Worn)",
            capacity: 2,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        "Hands (Carried)": {
            name: "Hands (Carried)",
            capacity: overburdened ? 4 : 2,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        Torso: {
            name: "Torso",
            capacity: 3,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        Pocket: {
            name: "Pocket",
            capacity: 1,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        Neck: {
            name: "Neck",
            capacity: 1,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        Feet: {
            name: "Feet",
            capacity: 1,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        Belt: {
            name: "Belt",
            capacity: 3,
            holdsBundles: false,
            slots: [],
            type: 'Body',
        },
        "On Ground": {
            name: "On Ground",
            holdsBundles: false,
            slots: [],
            type: 'Body',
        }
    };

    //Create an "inventory section" for any containers
    // in the actor's possession
    tbItems.forEach((tbItem) => {
        if (tbItem.tbData().capacity) {
            inventory[tbItem.data._id] = newItemInventory(tbItem)
        }
    });
    //Assign each item to it's inventory section, either
    // in a base inventory section, inside of another container's
    // inventory section, or on the ground if it's somehow gotten
    // disconnected from those places
    tbItems.forEach((tbItem) => {
        let tbItemData = tbItem.tbData();
        if (tbItemData.containerId && inventory[tbItemData.containerId]) {
            inventory[tbItemData.containerId].slots.push(tbItem);
        } else if (inventory[tbItemData.equip]) {
            inventory[tbItemData.equip].slots.push(tbItem);
        } else {
            inventory["On Ground"].slots.push(tbItem);
        }
    });

    //Validate that no containers refer to each other as parents
    validateContainers(inventory);

    //ensure capacity
    Object.keys(inventory).forEach((k) => {
        const sizeCache = {};
        let container = inventory[k];
        if (container.name === "Unknown") {
            container.slots.forEach((tbItem) => {
                inventory["On Ground"].slots.push(tbItem);
            });
            delete inventory[k];
        } else {
            const bundles = {};
            let consumed = 0;
            const removed = [];
            const slotted = [];
            container.slots.forEach((tbItem) => {
                //first, can the item be bundled? if so, do that and exit the rest
                // of the process
                let itemData = tbItem.tbData();
                itemData.computed.bundledWith = [];
                let itemName = itemData.name;
                let existingBundle = bundles[itemName];
                if(bundleableItem(tbItem, container, inventory[tbItem.data._id])) {
                    if(existingBundle) {
                        if(existingBundle.onBeforeBundleWith(tbItem, slotted)) {
                            //Add this item to the bundle and queue it for removal from this inventory slot set
                            existingBundle.tbData().computed.bundledWith.push(tbItem);
                            removed.push(tbItem);
                            //if the original item is now bundled with enough items to meet the size, it's
                            // no longer an eligible bundle
                            if(existingBundle.tbData().computed.bundledWith.length === itemData.bundleSize - 1) {
                                delete bundles[itemName];
                            }
                            //once it's in a bundle we know there's nothing else to do here
                            return;
                        } else {
                            delete bundles[itemName];
                        }
                    }
                }
                //last, can it be added to the container?
                //if so, great and start the next bundle if possible
                //if not, drop it on the ground
                const size = calculateConsumedSlots(tbItem, inventory, container, slotted, sizeCache);
                if ((consumed + size) > container.capacity) {
                    removed.push(tbItem);
                    inventory["On Ground"].slots.push(tbItem);
                    if(existingBundle) {
                        delete bundle[itemName];
                    }
                } else {
                    consumed += size;
                    if(bundleableItem(tbItem, container, inventory[tbItem.data._id])) {
                        bundles[itemName] = tbItem;
                    }
                    slotted.push(tbItem);
                }
            });
            if (removed.length) {
                container.slots = container.slots.filter((tbItem) => {
                    return !removed.includes(tbItem);
                });
            }
        }
    });

    //OnAfterAddToInventory Callback
    Object.keys(inventory).forEach((k) => {
        let container = inventory[k];
        const removed = [];
        const validated = [];
        container.slots.forEach((tbItem) => {
            if(tbItem.onAfterAddToInventory(container, validated)) {
                validated.push(tbItem);
            } else {
                removed.push(tbItem);
            }
        });
        if (removed.length) {
            container.slots = container.slots.filter((tbItem) => {
                return !removed.includes(tbItem);
            });
            removed.forEach((tbItem) => {
                inventory["On Ground"].slots.push(tbItem);
            });
        }
    });

    console.log(inventory);
    return inventory;
}

function calculateConsumedSlots(tbItem, inventory, container, given, sizeCache) {
    if(tbItem.tbData().resizes && inventory[tbItem.data._id] && container.type === 'Pack') {
        if(sizeCache[tbItem.data._id]) {
            return sizeCache[tbItem.data._id];
        }
        let computedSlots = tbItem.tbData().slots;
        inventory[tbItem.data._id].slots.forEach((containedTbItem) => {
            computedSlots += calculateConsumedSlots(containedTbItem, inventory, given, sizeCache);
        });
        tbItem.tbData().computed.consumedSlots = computedSlots;
        sizeCache[tbItem.data._id] = computedSlots;
    }
    tbItem.onCalculateConsumedSlots(container, given);
    return tbItem.tbData().computed.consumedSlots;
}

export function cloneInventory(inventory) {
    const cloned = newItemInventory(inventory);
    cloned.slots = [].concat(inventory.slots);
    return cloned;
}

//NOTE This doesn't work when testing against packs, only
// direct carry/worn slots, hence no containerId being passed
export function canFit(tbItem, containerType, inventory) {
    if(!containerType || containerType === 'Pack') return true;
    let container = inventory[containerType];
    const size = calculateConsumedSlots(tbItem, inventory, container, currentSubinventoryExcluding(container, tbItem), {});
    return size + currentConsumptionExcluding(container, tbItem) <= container.capacity;
}

let currentSubinventoryExcluding = function(container, tbItem) {
    return container.slots.filter((curr) => {
        return !(tbItem && tbItem.data._id === curr._id);
    });
}

let currentConsumptionExcluding = function(container, tbItem) {
    return container.slots.reduce((accum, curr) => {
        if(tbItem && tbItem.data._id === curr._id) {
            return accum;
        }
        return accum + curr.tbData().computed.consumedSlots;
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

Handlebars.registerHelper('renderInventory', function(capacity, srcId, srcContainer, placeholder, multiSlot) {
    let html = "";
    let consumed = 0;
    let container;
    if(!srcId) {
        container = {slots: []};
    } else {
        let newVar = game.actors.get(srcId);
        container = newVar.tbData().computed.inventory[srcContainer];
    }

    container.slots.forEach((tbItem) => {
        let consumedSlots = tbItem.tbData().computed.consumedSlots;
        consumed += consumedSlots;
        let linesToRender = consumedSlots || 1;
        for (let i = 0; i < linesToRender; i++) {
            let inventoryContainerClass = '';
            let containerType = '';
            let lastSlotTakenClass = '';
            if(tbItem.tbData().capacity) {
                inventoryContainerClass = 'inventory-container';
                containerType = 'Pack';
            }
            if(multiSlot === false || i === linesToRender - 1) {
                lastSlotTakenClass = 'last-slot-taken';
            }
            let quantityExpression = '';
            if(tbItem.tbData().computed.bundledWith && tbItem.tbData().computed.bundledWith.length > 0) {
                quantityExpression = `(${tbItem.tbData().computed.bundledWith.length + 1})`;
            }
            if(i === 0) {
                html +=
                    `<li class="item flexrow primary-slot-consumed ${inventoryContainerClass} ${lastSlotTakenClass}" data-item-id="${tbItem.data._id}" data-container-type="${containerType}">
                  <div class="item-image"><img src="${tbItem.data.img}" title="${tbItem.data.name}" alt="${tbItem.data.name}" width="24" height="24"/></div>
                  <h4 class="item-name" style="font-family: Souvenir-Medium;">${tbItem.data.name} ${quantityExpression}</h4>
                  <div class="item-controls">
                      <a class="item-control item-edit" title="Edit Item" style="margin-right: 5px;"><i class="fas fa-edit"></i></a>
                      <a class="item-control item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
                  </div>
              </li>`;
            } else if (multiSlot !== false) {
                html +=
                    `<li class="item flexrow secondary-slot-consumed ${inventoryContainerClass} ${lastSlotTakenClass}" data-item-id="${tbItem.data._id}" data-container-type="${containerType}">
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
