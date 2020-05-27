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
    
    html.find('#itemCarriedDropdown').click(ev => {
      this.item.update({'data.prevEquip': this.item.data.data.equip});
    });

    html.find('#itemCarriedDropdown').change(ev => {
      const newEquip = ev.currentTarget.selectedOptions[0].value;
      const oldEquip = this.item.data.data.prevEquip;
      const oldSlots = this.item.data.data.slots;
      const selectedValue = ev.currentTarget.selectedIndex;
      const selectedTemplateName = ev.currentTarget.children[selectedValue].attributes[0].value;
      let newSlots = 0;
      if (selectedTemplateName === 'data.equipOptions.option1.value') {
        newSlots = this.item.data.data.slotOptions.option1.value;
      } else if (selectedTemplateName === 'data.equipOptions.option2.value') {
        newSlots = this.item.data.data.slotOptions.option2.value;
      } else if(selectedTemplateName === 'data.equipOptions.option3.value') {
        newSlots = this.item.data.data.slotOptions.option3.value;
      }
      
      console.log('Old: ' + this.item.data.data.equip + ' ' + oldSlots);
      console.log('New: ' + newEquip + " " + newSlots);

      console.log(this.actor);

      if (this.actor != null) {
        // Remove the slots being used from slotsAvailable
        switch (newEquip) {
          case "Head":
            this.actor.update({'data.Head.wornSlotsAvailable': this.actor.data.data.Head.wornSlotsAvailable - newSlots});
            break;
          case "Neck":
            this.actor.update({'data.Neck.wornSlotsAvailable': this.actor.data.data.Neck.wornSlotsAvailable - newSlots});
            break;
          case "Hands (Worn)":
            this.actor.update({'data.Hands.wornSlotsAvailable': this.actor.data.data.Hands.wornSlotsAvailable - newSlots});
            break;
          case "Hands (Carried)":
            this.actor.update({'data.Hands.carriedSlotsAvailable': this.actor.data.data.Hands.carriedSlotsAvailable - newSlots});
            break;
          case "Feet":
            this.actor.update({'data.Feet.wornSlotsAvailable': this.actor.data.data.Feet.wornSlotsAvailable - newSlots});
            break;
          case "Torso":
            this.actor.update({'data.Torso.wornSlotsAvailable': this.actor.data.data.Torso.wornSlotsAvailable - newSlots});
            break;
          case "Belt":
            this.actor.update({'data.Belt.packSlotsAvailable': this.actor.data.data.Belt.packSlotsAvailable - newSlots});
            break; 
        }
        // Add the slots being vacated back to slotsAvailable
        switch (oldEquip) {
          case "Head":
            this.actor.update({'data.Head.wornSlotsAvailable': this.actor.data.data.Head.wornSlotsAvailable + oldSlots});
            break;
          case "Neck":
            this.actor.update({'data.Neck.wornSlotsAvailable': this.actor.data.data.Neck.wornSlotsAvailable + oldSlots});
            break;
          case "Hands (Worn)":
            this.actor.update({'data.Hands.wornSlotsAvailable': this.actor.data.data.Hands.wornSlotsAvailable + oldSlots});
            break;
          case "Hands (Carried)":
            this.actor.update({'data.Hands.carriedSlotsAvailable': this.actor.data.data.Hands.carriedSlotsAvailable + oldSlots});
            break;
          case "Feet":
            this.actor.update({'data.Feet.wornSlotsAvailable': this.actor.data.data.Feet.wornSlotsAvailable + oldSlots});
            break;
          case "Torso":
            this.actor.update({'data.Torso.wornSlotsAvailable': this.actor.data.data.Torso.wornSlotsAvailable + oldSlots});
            break;
          case "Belt":
            this.actor.update({'data.Belt.packSlotsAvailable': this.actor.data.data.Belt.packSlotsAvailable + oldSlots});
            break; 
        }
      }
    });
  }
}
