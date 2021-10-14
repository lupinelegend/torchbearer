import { TorchbearerBaseItemSheet } from "../base-sheet";

export class TorchbearerItemSheet extends TorchbearerBaseItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "item"],
      template: "systems/torchbearer/templates/item/item-sheet.html.hbs",
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".items-list .item", dropSelector: null }],
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.inventoryContainerClass = "";
    data.containerType = "";
    if (this.item.data.data.capacity) {
      data.inventoryContainerClass = "inventory-container";
      data.containerType = "Pack";
    }
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
    html.find(".item-name.clickable").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");

      if (this.item.actor) {
        this.item.actor.removeItemFromInventory(li.data("itemId")).then(() => {
          setTimeout(() => {
            this.item._onUpdate({}, { render: true });
          }, 0);
        });
      }
    });

    // Drop Inventory Item
    html.find(".item-drop").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      if (this.item.actor) {
        let tbItem = this.item.actor.items.get(li.data("itemId"));
        tbItem
          .update({
            data: {
              equip: "On Ground",
              carried: "Ground",
              slots: 1,
              containerId: "",
            },
          })
          .then(() => {
            setTimeout(() => {
              this.item._onUpdate({}, { render: true });
              this.item.actor._onUpdate({ items: true }, { render: true });
            }, 0);
          });
      }
    });

    // Consume Item
    html.find(".item-consume").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      if (this.item.actor) {
        let tbItem = this.item.actor.items.get(li.data("itemId"));
        tbItem.consumeOne().then((consumed) => {
          if (consumed) {
            setTimeout(() => {
              this.item._onUpdate({}, { render: true });
              this.item.actor._onUpdate({ items: true }, { render: true });
            }, 0);
          }
        });
      }
    });

    // Activate Item
    html.find(".item-activate").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      if (this.item.actor) {
        let tbItem = this.item.actor.items.get(li.data("itemId"));
        tbItem.toggleActive().then((toggled) => {
          if (toggled) {
            setTimeout(() => {
              this.item._onUpdate({}, { render: true });
            }, 0);
          }
        });
      }
    });
  }

  /** @override */
  _canDragStart(/* selector */) {
    return this.options.editable && this.item.actor?.isOwner;
  }

  /* -------------------------------------------- */

  /** @override */
  _canDragDrop(/* selector */) {
    return this.options.editable && this.item.actor?.isOwner;
  }

  /* -------------------------------------------- */

  /** @override */
  _onDragStart(event) {
    const li = event.currentTarget;
    const item = this.item.actor.items.get(li.dataset.itemId);
    const dragData = {
      type: "Item",
      actorId: this.item.actor.id,
      data: item.data,
      source: "Pack",
    };
    if (this.item.actor.isToken) dragData.tokenId = this.item.actor.token.id;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDrop(event) {
    if (!this.item.actor) {
      return;
    }
    this.item.actor.sheet._onDrop(event).then(() => {
      setTimeout(() => {
        this.item._onUpdate({}, { render: true });
      }, 0);
    });
  }
}
