/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class TorchbearerItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "item"],
      width: 450,
      height: 450,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{dragSelector: ".items-list .item", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    const path = "systems/torchbearer/templates/item";
    // Return a single sheet for all item types.
    return `${path}/item-sheet.html`;
    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.

    // return `${path}/${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.inventoryContainerClass = '';
    data.containerType = '';
    if(this.item.data.data.capacity) {
      data.inventoryContainerClass = 'inventory-container';
      data.containerType = 'Pack';
    }
    if(this.item.actor) {
      data._actor_id = this.item.actor.data._id;
    }
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
    html.find('.item-name.clickable').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      if(this.item.actor) {
        this.item.actor.removeItemFromInventory(li.data("itemId")).then(() => {
          setTimeout(() => {
            this.item._onUpdate();
          }, 0);
        });
      }
    });

    // Drop Inventory Item
    html.find('.item-drop').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      if(this.item.actor) {
        let tbItem = this.item.actor.getOwnedItem(li.data("itemId"));
        tbItem.update({
          data: {
            equip: "On Ground",
            carried: "Ground",
            slots: 1,
            containerId: '',
          }
        }).then(() => {
          setTimeout(() => {
            this.item._onUpdate();
          }, 0);
        })
      }
    });

    // Consume Item
    html.find('.item-consume').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      if(this.item.actor) {
        let tbItem = this.item.actor.getOwnedItem(li.data("itemId"));
        tbItem.consumeOne().then(() => {
          setTimeout(() => {
            this.item._onUpdate();
          }, 0);
        });
      }
    });

    // Activate Item
    html.find('.item-activate').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      if(this.item.actor) {
        let tbItem = this.item.actor.getOwnedItem(li.data("itemId"));
        tbItem.toggleActive().then(() => {
          setTimeout(() => {
            this.item._onUpdate();
          }, 0);
        });
      }
    });


  }

  /** @override */
  _canDragStart(selector) {
    return this.options.editable && this.item.actor && this.item.actor.owner;
  }

  /* -------------------------------------------- */

  /** @override */
  _canDragDrop(selector) {
    return this.options.editable && this.item.actor && this.item.actor.owner;
  }

  /* -------------------------------------------- */

  /** @override */
  _onDragStart(event) {
    const li = event.currentTarget;
    const item = this.item.actor.getOwnedItem(li.dataset.itemId);
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
    if(!this.item.actor) {
      return;
    }
    this.item.actor.sheet._onDrop(event).then(() => {
      setTimeout(() => {
        this.item._onUpdate();
      }, 0);
    });
  }
}
