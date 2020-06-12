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
            if(container.type === 'Body') return true;
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
    }
}