(async () => {
  for (let item of game.items) {
    await Item.delete(item._id);
  }
  game.items.directory.render();
  for (let actor of game.actors) {
    for (let item of actor.items) {
      await actor.removeItemFromInventory(item._id);
    }
  }
  const compendiums = ["armor", "containers", "equipment", "weapons", "lights", "clothing", "food", "spells"];
  const compendiumMeta = {
    spells: {
      createSubfolders: async (parent) => {
        const subfolders = {};
        subfolders.First = await Folder.create({ type: "Item", parent: parent, name: "First Circle" });
        subfolders.Second = await Folder.create({ type: "Item", parent: parent, name: "Second Circle" });
        return subfolders;
      },
      chooseSubfolder: (item, parent, subfolders) => {
        if (subfolders[item.data.data.circle]) {
          return subfolders[item.data.data.circle];
        }
        return parent;
      },
    },
  };
  const createSubfolders = async (parent, kind) => {
    if (compendiumMeta[kind] && compendiumMeta[kind].createSubfolders) {
      return await compendiumMeta[kind].createSubfolders(parent);
    } else {
      return {};
    }
  };
  const chooseFolder = (item, kind, parent, subfolders) => {
    if (compendiumMeta[kind] && compendiumMeta[kind].chooseSubfolder) {
      return compendiumMeta[kind].chooseSubfolder(item, parent, subfolders);
    } else {
      return parent;
    }
  };
  const allItemFolders = game.folders.filter((f) => f.data.type === "Item");
  for (let i = 0; i < allItemFolders.length; i++) {
    let folder = allItemFolders[i];
    if (compendiums.includes(folder.name.toLowerCase())) {
      await Folder.delete(folder._id);
    }
  }
  for (let i = 0; i < compendiums.length; i++) {
    const kind = compendiums[i];
    const folder = await Folder.create({ type: "Item", parent: null, name: kind[0].toUpperCase() + kind.slice(1) });
    const subfolders = await createSubfolders(folder, kind);
    const pack = game.packs.find((p) => p.collection === `torchbearer.${kind}`);
    await pack.configure({ locked: false });
    const existingContent = await pack.getContent();
    for (const entry of existingContent) {
      await pack.deleteEntity(entry._id);
    }
    const response = await fetch(`systems/torchbearer/Compendium jsons/${kind}.json`);
    const content = await response.json();
    const created = await Item.create(content, { temporary: true });
    if (created.data) {
      const entity = await pack.importEntity(created);
      console.log(`Imported Item ${created.name} into Compendium pack ${pack.collection}`);
      let importedItem = await game.items.importFromCollection(`torchbearer.${kind}`, entity._id);
      await importedItem.update({
        folder: chooseFolder(importedItem, kind, folder, subfolders)._id,
        permission: {
          default: 2,
        },
      });
    } else {
      for (let i of created) {
        const entity = await pack.importEntity(i);
        console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
        let importedItem = await game.items.importFromCollection(`torchbearer.${kind}`, entity._id);
        await importedItem.update({
          folder: chooseFolder(importedItem, kind, folder, subfolders)._id,
          permission: {
            default: 2,
          },
        });
      }
    }
    await pack.configure({ locked: true });
  }
  game.items.directory.render();
})();
