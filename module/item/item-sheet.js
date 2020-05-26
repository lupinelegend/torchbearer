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
      height: 400,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
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
  }
}
