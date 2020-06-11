export const itemExtensions = {
    "Backpack": {
        onAfterAddToInventory: function(container, validated) {
            //Only one of a backpack or a satchel can be worn
            if(container.name === 'Torso') {
                for(let i = 0; i < validated.length; i++) {
                    if(validated[i].name === 'Backpack'
                    || validated[i].name === 'Satchel') {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    "Satchel": {
        onAfterAddToInventory: function(container, validated) {
            //Only one of a backpack or a satchel can be worn
            if(container.name === 'Torso') {
                for(let i = 0; i < validated.length; i++) {
                    if(validated[i].name === 'Backpack'
                        || validated[i].name === 'Satchel') {
                        return false;
                    }
                }
            }
            return true;
        }
    }
}