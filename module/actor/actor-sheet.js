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
      width: 617,
      height: 848,
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
    //html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      // const equip = item.data.data.equip;
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      this.actor.removeItemFromInventory(li.data("itemId"));

      // Get the equipment slot of the item being deleted
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));

    // Class changes
    html.find('#classDropdown').change(ev => {
      let className = ev.currentTarget.selectedOptions[0].value;
      const classPack = game.packs.get("torchbearer.classes");
      let entry;
      classPack.getIndex().then(index => classPack.index.find(e => e.name === className)).then(f => {
        entry = f;
        classPack.getEntity(entry._id).then(cl => {
          console.log(cl);
          // I can access compendium classes from here.
        });
      });
    });

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
    
    // Prevent item creation if there are no inventory slots for it, else lower number of slots by 1
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
      case "Pack":
        console.log(this.actor.data.data.Pack.packSatchel);
        if (this.actor.data.data.Pack.packSatchel === true) {
          // The Actor has a satchel equipped and has 3 total slots
          if (this.actor.data.data.Pack.packSlotsAvailableSatchel < 1) {
            ui.notifications.error('ERROR: No additional satchel inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Pack.packSlotsAvailableSatchel': this.actor.data.data.Pack.packSlotsAvailableSatchel - 1});
          }
        } else {
          // The Actor has a backpack equipped and has 6 total slots
          if (this.actor.data.data.Pack.packSlotsAvailableBackpack < 1) {
            ui.notifications.error('ERROR: No additional backpack inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Pack.packSlotsAvailableBackpack': this.actor.data.data.Pack.packSlotsAvailableBackpack - 1});
          }
        }
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

  subtractAvailableSlots(location, howCarried, slots) {
    console.log("Slots ", slots);
    console.log("Total ", this.actor.data.data[location][howCarried + "SlotsTotal"]);
    console.log("Available ", this.actor.data.data[location][howCarried + "SlotsAvailable"]);
    if (slots > this.actor.data.data[location][howCarried + "SlotsTotal"]) {
      ui.notifications.error('ERROR: Item too large to be ' + howCarried + ' on your ' + location + '.');
      return false;
    } else if (slots > this.actor.data.data[location][howCarried + "SlotsAvailable"]) {
      ui.notifications.error('ERROR: Not enough ' + location + ' inventory slots available.');
      return false;
    } else {
      const update = {};
      update['data.' + location + '.' + howCarried + 'SlotsAvailable'] = this.actor.data.data[location][howCarried + "SlotsAvailable"] - slots;
      console.log("Update ", JSON.stringify(update));
      this.actor.update(update);
      return true;
    }
  }

  /** @override */
  async _onDrop(event) {
    console.log(event);
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (data.type !== "Item") return;
      const id = data.id;
      const item = game.items.get(id);
      const equip = item.data.data.equip;
      const slots = item.data.data.slots;
      console.log('Equip location: ' + equip);
      console.log('Slots: ' + slots);

      switch (equip) {
        case "Head":
          if(!this.subtractAvailableSlots("Head", "worn", slots)) {
            return;
          }
          break;
        case "Neck":
          if(!this.subtractAvailableSlots("Neck", "worn", slots)) {
            return;
          }
          break;
        case "Hands (Worn)":
          if(!this.subtractAvailableSlots("Hands", "worn", slots)) {
            return;
          }
          break;
        case "Hands (Carried)":
          if(!this.subtractAvailableSlots("Hands", "carried", slots)) {
            return;
          }
          break;
        case "Feet":
          if(!this.subtractAvailableSlots("Feet", "worn", slots)) {
            return;
          }
          break;
        case "Torso":
          if(!this.subtractAvailableSlots("Torso", "worn", slots)) {
            return;
          }
          break;
        case "Belt":
          if(!this.subtractAvailableSlots("Belt", "pack", slots)) {
            return;
          }
          break;
        case "Quiver":

        case "Pack":
        // case "Pack":
        //   console.log(this.actor.data.data.Pack.packSatchel);
        //   if (this.actor.data.data.Pack.packSatchel === true) {
        //     // The Actor has a satchel equipped and has 3 total slots
        //     if (this.actor.data.data.Pack.packSlotsAvailableSatchel < 1) {
        //       ui.notifications.error('ERROR: No additional satchel inventory slots available.');
        //       return;
        //     } else {
        //       this.actor.update({'data.Pack.packSlotsAvailableSatchel': this.actor.data.data.Pack.packSlotsAvailableSatchel - 1});
        //     }
        //   } else {
        //     // The Actor has a backpack equipped and has 6 total slots
        //     if (this.actor.data.data.Pack.packSlotsAvailableBackpack < 1) {
        //       ui.notifications.error('ERROR: No additional backpack inventory slots available.');
        //       return;
        //     } else {
        //       this.actor.update({'data.Pack.packSlotsAvailableBackpack': this.actor.data.data.Pack.packSlotsAvailableBackpack - 1});
        //     }
        //   }
        //   break;         
      }
    } catch (err) {
      return false;
    }

    super._onDrop(event);
  }

}
