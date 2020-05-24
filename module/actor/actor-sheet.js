/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class TorchbearerActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "actor"],
      template: "systems/torchbearer/templates/actor/actor-sheet.html",
      width: 612,
      height: 840,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    
    // Condition checkboxes
    const conditionStates = [data.data.hungryandthirsty, data.data.angry, data.data.afraid, data.data.exhausted, data.data.injured, data.data.sick, data.data.dead];
    const inc = (100 / 7);
    let conditionsTrue = 0;
    conditionStates.forEach(element => {
      if (element === true) {
        conditionsTrue++;
      }
    });
    data.data.conditionProgress = Math.round(conditionsTrue * inc);

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    this.html = html;

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    //html.find('.item-create').click(ev => this._onItemCreate(ev));
    html.find('.item-create').click(this._onItemCreate.bind(this));
    //html.find('.item-create').click(this._onItemCreate.bind(this, html));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      const equip = item.data.data.equip;
      switch (equip) {
        case "Head":
          if (equip > this.actor.data.data.Head.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough head inventory slots available.');
            console.log('ERROR: Not enough head inventory slots available.');
            return;
          }
          break;
        case "Neck":
          if (equip > this.actor.data.data.Neck.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough neck inventory slots available.');
            return;
          }
          break;
        case "Hands":
          if (equip > this.actor.data.data.Hands.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough hand inventory slots available.');
            return;
          }
          break;
        case "Feet":
          if (equip > this.actor.data.data.Feet.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough feet inventory slots available.');
            return;
          }
          break;
        case "Torso":
          if (equip > this.actor.data.data.Torso.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough torso inventory slots available.');
            return;
          }
          break;
        case "Pack":
          if (equip > this.actor.data.data.Pack.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough pack inventory slots available.');
            return;
          }
          break;
      }

      // Render the updated item
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      // Get the equipment slot of the item being deleted
      const equip = this.actor.getOwnedItem(li.data("itemId")).data.data.equip;
      const slotsVacated = this.actor.getOwnedItem(li.data("itemId")).data.data.slots;
      
      // Add the slots being vacated back to slotsAvailable
      switch (equip) {
        case "Head":
          this.actor.update({'data.Head.wornSlotsAvailable': this.actor.data.data.Head.wornSlotsAvailable + slotsVacated});
          break;
        case "Neck":
          this.actor.update({'data.Neck.wornSlotsAvailable': this.actor.data.data.Neck.wornSlotsAvailable + slotsVacated});
          break;
        case "Hands":
          break;
        case "Feet":
          this.actor.update({'data.Feet.wornSlotsAvailable': this.actor.data.data.Feet.wornSlotsAvailable + slotsVacated});
          break;
        case "Torso":
          this.actor.update({'data.Torso.wornSlotsAvailable': this.actor.data.data.Torso.wornSlotsAvailable + slotsVacated});
          break;
        case "Pocket":
          break;
        case "Pack":
          break;    
      }
      
      // Delete the item
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    
    //console.log(this.html.find('#headPlaceholder'));
    const header = event.currentTarget;
    
    // Get the type of item to create.
    const type = header.dataset.type;
    switch (header.type) {
      case "Head":
        if (this.actor.data.data.Head.wornSlotsAvailable < 1) {
          ui.notifications.error('ERROR: No additional head inventory slots available.');
          return;
        } else {
          this.actor.update({'data.Head.wornSlotsAvailable': this.actor.data.data.Head.wornSlotsAvailable - 1});
        }
        break;
      case "Neck":
        if (this.actor.data.data.Neck.wornSlotsAvailable < 1) {
          ui.notifications.error('ERROR: No additional neck inventory slots available.');
          return;
        } else {
          this.actor.update({'data.Neck.wornSlotsAvailable': this.actor.data.data.Neck.wornSlotsAvailable - 1});
        }
        break;
      case "Hands":
        break;
      case "Feet":
        break;
      case "Torso":
        if (this.actor.data.data.Torso.wornSlotsAvailable < 1) {
          ui.notifications.error('ERROR: No additional torso inventory slots available.');
          return;
        } else {
          this.actor.update({'data.Torso.wornSlotsAvailable': this.actor.data.data.Torso.wornSlotsAvailable - 1});
        }
        break;
      case "Pocket":
        break;
      case "Pack":
        break;         
    }

    // Grab any data associated with this control.
    const equipSlot = header.type;
    const data = duplicate(header.dataset);
    data.equip = equipSlot;

    // Initialize a default name.
    const name = `New ${type.capitalize()}`;

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
  }

}
