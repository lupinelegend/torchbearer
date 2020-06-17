(async () => {
    for (let actor of game.actors) {
        for(let item of actor.items) {
            await actor.removeItemFromInventory(item._id);
        }
        const containers = game.packs.find(p => p.collection === 'torchbearer.containers');
        let backpackId;
        let content = await containers.getContent();
        for (const entry of content) {
            if(entry.data.name === 'Backpack') {
                let res = await actor.importItemFromCollection('torchbearer.containers', entry._id);
                backpackId = res._id;
            }
            if(entry.data.name === 'Waterskin') {
                await actor.importItemFromCollection('torchbearer.containers', entry._id);
            }
        }

        const lights = game.packs.find(p => p.collection === 'torchbearer.lights');
        content = await lights.getContent();
        for (const entry of content) {
            if(entry.data.name === 'Torch') {
                for(let i = 0; i < 3; i++) {
                    let res = await actor.importItemFromCollection('torchbearer.lights', entry._id);
                    if(i < 2) {
                        let torch = actor.items.get(res._id);
                        await torch.update({
                            data: {
                                equip: 'Pack',
                                containerId: backpackId,
                            }
                        });
                    }
                }
            }
        }
        const weapons = game.packs.find(p => p.collection === 'torchbearer.weapons');
        content = await weapons.getContent();
        for (const entry of content) {
            if(entry.data.name === 'Sword') {
                await actor.importItemFromCollection('torchbearer.weapons', entry._id);
            }
        }
        const food = game.packs.find(p => p.collection === 'torchbearer.food');
        content = await food.getContent();
        for (const entry of content) {
            if(entry.data.name === 'Rations, Preserved') {
                for(let i = 0; i < 3; i++) {
                    let res = await actor.importItemFromCollection('torchbearer.food', entry._id);
                    let rations = actor.items.get(res._id);
                    await rations.update({
                        data: {
                            equip: 'Pack',
                            containerId: backpackId,
                        }
                    });
                }
            }
        }
    }
})()