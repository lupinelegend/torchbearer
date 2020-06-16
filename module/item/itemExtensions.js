class SharedItemBehaviors {
    static compareLanternsByFuel(a, b) {
        return (b.consumed) - (a.consumed);
    }

    static leastFueledLanternInHands(actor) {
        const inventory = actor.tbData().computed.inventory;
        const container = inventory["Hands (Carried)"];
        let lanterns = [];
        for(let j = 0; j < container.slots.length; j++) {
            const item = container.slots[j];
            if(item.name === 'Lantern') {
                if(item.data.lightsource.remaining < item.data.lightsource.lasts) {
                    lanterns.push({
                        consumed: item.data.lightsource.lasts - item.data.lightsource.remaining,
                        _id: item._id,
                    });
                }
            }
        }
        if(lanterns.length > 0) {
            return actor.items.get(lanterns.sort(SharedItemBehaviors.compareLanternsByFuel)[0]._id);
        } else return null;
    }

    static async clearHungryThirsty(item) {
        if(!item) {
            item = this;
        }
        if(item.actor && item.actor.tbData().hungryandthirsty) {
            await item.actor.update({
                data: {
                    hungryandthirsty: false
                }
            });
        }
    }

    static abortIfStowedOrFuelless(item) {
        if(!item) {
            item = this;
        }
        // If it's somehow active, allow it to deactivate no matter what
        if(item.tbData().activatable.active) {
            return true;
        }
        if(item.tbData().equip === 'Pack') {
            ui.notifications.error("You can't light something stowed in a pack");
            return false;
        }
        if(!item.tbData().lightsource.remaining) {
            ui.notifications.error("There is no remaining fuel in this object");
            return false;
        }
        return true;
    }

    static async deactivateWhenOutOfFuel(item) {
        if(!item) {
            item = this;
        }
        if(item.tbData().lightsource.remaining === 0) {
            await item.update({
                data: {
                    activatable: {
                        active: false,
                    }
                }
            });
        }
    }

    static async deactivateWhenStowed(equippedEvent, item) {
        if(!item) {
            item = this;
        }
        if(item.tbData().activatable.active && equippedEvent.containerType === 'Pack') {
            await item.update({
                data: {
                    activatable: {
                        active: false,
                    }
                }
            });
        }
    }
}

export const itemExtensions = {
    "Backpack": {
        onAfterAddToInventory: function(container, given) {
            //Only one of a backpack or a satchel can be worn
            if(container.name === 'Torso') {
                for(let i = 0; i < given.length; i++) {
                    if(given[i].name === 'Backpack'
                    || given[i].name === 'Satchel') {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    "Satchel": {
        onAfterAddToInventory: function(container, given) {
            //Only one of a backpack or a satchel can be worn
            if(container.name === 'Torso') {
                for(let i = 0; i < given.length; i++) {
                    if(given[i].name === 'Backpack'
                        || given[i].name === 'Satchel') {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    "Bow": {
        onAfterAddToInventory: function(container, given) {
            //Only one of a backpack or a satchel can be worn
            if(container.type === 'Body' || container.type === 'Elsewhere') return true;
            if(container.type === 'Pack' && container.name !== 'Quiver') return false;
            for(let i = 0; i < given.length; i++) {
                if(given[i].name === 'Bow') {
                    return false;
                }
            }
            return true;
        }
    },
    "Small Sack": {
        onBeforeBundleWith: function(tbItemOther, given) {
            let count = 0;
            given.forEach((tbItem) => {
                if(tbItem.name === 'Small Sack') {
                    count += 1;
                    count += tbItem.tbData().computed.bundledWith.length;
                }
            });
            return count % 2 !== 0;
        },
        onCalculateConsumedSlots: function(container, given) {
            if(container.type === 'Pack') {
                let count = 0;
                given.forEach((tbItem) => {
                    if(tbItem.name === 'Small Sack') {
                        count += 1;
                        count += tbItem.tbData().computed.bundledWith.length;
                    }
                });
                if(count % 2 === 1) {
                    this.tbData().computed.consumedSlots -= 1;
                }
            }
        }
    },
    "Waterskin": {
        onAfterConsumed: SharedItemBehaviors.clearHungryThirsty,
    },
    "Bottle": {
        onAfterConsumed: SharedItemBehaviors.clearHungryThirsty,
    },
    "Jug": {
        onAfterConsumed: SharedItemBehaviors.clearHungryThirsty,
    },
    "Rations, Fresh": {
        onAfterConsumed: SharedItemBehaviors.clearHungryThirsty,
    },
    "Rations, Preserved": {
        onAfterConsumed: SharedItemBehaviors.clearHungryThirsty,
    },
    "Flask of Oil": {
        onBeforeConsumed: function() {
            if(!this.actor) return false;
            let lanternTbItem = SharedItemBehaviors.leastFueledLanternInHands(this.actor);
            if(lanternTbItem && lanternTbItem.tbData().lightsource.remaining === 0) {
                return true;
            } else {
                ui.notifications.error("You must be Carrying an unfueled Lantern in your Hands.");
                return false;
            }
        },
        onAfterConsumed: async function() {
            if(!this.actor) return;
            let lanternTbItem = SharedItemBehaviors.leastFueledLanternInHands(this.actor);
            if(lanternTbItem
                && lanternTbItem.tbData().lightsource.remaining < lanternTbItem.tbData().lightsource.lasts) {
                await lanternTbItem.update({
                    data: {
                        lightsource: {
                            remaining: lanternTbItem.tbData().lightsource.lasts,
                        }
                    }
                });
            }
        }
    },
    "Torch": {
        onBeforeActivate: SharedItemBehaviors.abortIfStowedOrFuelless,
        onAfterConsumed: SharedItemBehaviors.deactivateWhenOutOfFuel,
        onAfterEquipped: SharedItemBehaviors.deactivateWhenStowed,
    },
    "Candle": {
        onBeforeActivate: SharedItemBehaviors.abortIfStowedOrFuelless,
        onAfterConsumed: SharedItemBehaviors.deactivateWhenOutOfFuel,
        onAfterEquipped: SharedItemBehaviors.deactivateWhenStowed,
    },
    "Lantern": {
        onBeforeActivate: SharedItemBehaviors.abortIfStowedOrFuelless,
        onAfterConsumed: SharedItemBehaviors.deactivateWhenOutOfFuel,
        onAfterEquipped: SharedItemBehaviors.deactivateWhenStowed,
    },
}