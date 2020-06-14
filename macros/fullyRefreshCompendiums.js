( async () => {
    for(let item of game.items) {
        await Item.delete(item._id);
    }
    game.items.directory.render();
    for(let actor of game.actors) {
        for(let item of actor.items) {
            await actor.removeItemFromInventory(item._id);
        }
    }
    const compendiums = ['armor', 'containers', 'equipment', 'weapons', 'lights', 'clothing', 'food'];
    const allItemFolders = game.folders.filter(f => f.data.type === 'Item');
    for(let i = 0; i < allItemFolders.length; i++) {
        let folder = allItemFolders[i];
        if(compendiums.includes(folder.name.toLowerCase())) {
            await Folder.delete(folder._id);
        }
    }
    for(let i = 0; i < compendiums.length; i++) {
        const kind = compendiums[i];
        const folder = await Folder.create({type: "Item", parent: null, name: (kind[0].toUpperCase() + kind.slice(1))})
        const pack = game.packs.find(p => p.collection === `torchbearer.${kind}`);
        await pack.configure({locked: false});
        const existingContent = await pack.getContent();
        for(const entry of existingContent) {
            await pack.deleteEntity(entry._id);
        }
        const response = await fetch(`systems/torchbearer/Compendium jsons/${kind}.json`);
        const content = await response.json();
        const created = await Item.create(content, {temporary: true});
        if(created.data) {
            const entity = await pack.importEntity(created);
            console.log(`Imported Item ${created.name} into Compendium pack ${pack.collection}`);
            let importedItem = await game.items.importFromCollection(`torchbearer.${kind}`, entity._id);
            await importedItem.update({
                folder: folder._id,
            });
        } else {
            for ( let i of created ) {
                const entity = await pack.importEntity(i);
                console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
                let importedItem = await game.items.importFromCollection(`torchbearer.${kind}`, entity._id);
                await importedItem.update({
                    folder: folder._id,
                });
            }
        }
        await pack.configure({locked: true});
    }
    game.items.directory.render();
})()