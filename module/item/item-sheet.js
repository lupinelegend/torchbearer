/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
import {isCompatibleContainer} from "../inventory/inventory.js";

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
    switch (this.item.data.data.equip) {
      case this.item.data.data.equipOptions.option1.value:
        this.item.update({'data.carried': this.item.data.data.carryOptions.option1.value});
        this.item.update({'data.slots': this.item.data.data.slotOptions.option1.value});
        break;
      case this.item.data.data.equipOptions.option2.value:
        this.item.update({'data.carried': this.item.data.data.carryOptions.option2.value});
        this.item.update({'data.slots': this.item.data.data.slotOptions.option2.value});
        break;
      case this.item.data.data.equipOptions.option3.value:
        this.item.update({'data.carried': this.item.data.data.carryOptions.option3.value});
        this.item.update({'data.slots': this.item.data.data.slotOptions.option3.value});
        break;
    }

    data.inventoryContainerClass = '';
    data.containerType = '';
    if(this.item.data.data.capacity) {
      data.inventoryContainerClass = 'inventory-container';
      data.containerType = 'Pack';
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
    html.find('.item-edit').click(ev => {
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
      data: item.data
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
