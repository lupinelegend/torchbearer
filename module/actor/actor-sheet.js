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
    // html.find('#classDropdown').change(ev => {
    //   let className = ev.currentTarget.selectedOptions[0].value;
    //   const classPack = game.packs.get("torchbearer.classes");
    //   let entry;
    //   classPack.getIndex().then(index => classPack.index.find(e => e.name === className)).then(f => {
    //     entry = f;
    //     classPack.getEntity(entry._id).then(cl => {
    //       console.log(cl);
    //       // I can access compendium classes from here.
    //     });
    //   });
    // });

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
    
    // Determine attribute/skill to roll
    let rollTarget = dataset.label;

    // Capitalize first letter for later use in the roll template
    let header = rollTarget.charAt(0).toUpperCase() + rollTarget.slice(1);

    // Dialog box for roll customization
    let dialogContent = 'systems/torchbearer/templates/roll-dialog-content.html';
    
    // Build an actor trait list to be passed to the dialog box
    let traits = [];
    const traitList = this.actor.data.data.traits;
    Object.keys(traitList).forEach(key => {
      traits.push(traitList[key].name);
    });

    renderTemplate(dialogContent, {attribute: header, traitList: traits}).then(template => {
      new Dialog({
        title: `Test`,
        content: template,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Roll`,
            callback: (html) => {
              let flavor = html.find('#flavorText')[0].value;
              let help = html.find('#helpingDice')[0].value;
              let ob = html.find('#ob')[0].value;
              let nature = html.find('#natureYes')[0].checked;
              let trait = {
                name: html.find('#traitDropdown')[0].value,
                usedFor: html.find('#traitFor')[0].checked,
                usedAgainst: html.find('#traitAgainst')[0].checked
              };
              this.tbRoll(rollTarget, flavor, header, help, ob, trait, nature);
            }
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel`
          }
        },
        default: 'yes'
      }).render(true);
    });
  }

  tbRoll(rollTarget, flavor, header, help, ob, trait, nature) {
    // Determine if and how a Trait is being used
    let traitMod = 0;
    if (trait.name != "") {
      if (trait.usedFor === true) {
        traitMod = 1;
      } else if (trait.usedAgainst === true) {
        traitMod = -1;
      }
    }

    // Determine if Nature has been tapped
    let natureMod = 0;
    if (nature === true) {
      natureMod = this.actor.data.data.nature.value;
    }
    
    // Determine number of dice to roll. isNaN makes sure the roll goes through if the
    // help field is left blank.
    let diceToRoll;
    if (isNaN(parseInt(help))) {
      diceToRoll = this.actor.data.data[rollTarget].value + traitMod + natureMod;
    } else{
      diceToRoll = this.actor.data.data[rollTarget].value + traitMod + natureMod + parseInt(help);
    }

    // Build the formula
    let formula = `${diceToRoll}d6`;

    // Prep the roll template
    let template = 'systems/torchbearer/templates/torchbearer-roll.html';

    // GM rolls
    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    };
    let templateData = {
      title: header,
      flavorText: flavor,
      rollDetails: `${diceToRoll}D vs. Ob ${ob}`,
      roll: {}
    };

    // Handle roll visibility. Blind doesn't work; you'll need a render hook to hide it.
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Do the roll
    let roll = new Roll(formula);
    roll.roll();

    //Create an array of the roll results
    let rollResult = [];
    roll.parts[0].rolls.forEach(key => {
      if (key.roll === 6) {
        rollResult.push({
          result: key.roll,
          style: 'max'
        });
      } else {
        rollResult.push({
          result: key.roll,
        });
      }
    });

    // Count successes
    let rolledSuccesses = 0;
    let displaySuccesses;
    rollResult.forEach((index) => {
      if (index.result > 3) {
        rolledSuccesses++;
      }
    });
    if (rolledSuccesses === 1) {
      displaySuccesses = `${rolledSuccesses} Success`;
    } else {
      displaySuccesses = `${rolledSuccesses} Successes`;
    }

    let passFail = 'Fail!';
    if (rolledSuccesses >= ob) {
      passFail = 'Pass!'
    }

    renderTemplate('systems/torchbearer/templates/roll-template.html', {title: header, results: rollResult, dice: diceToRoll, success: displaySuccesses, flavorText: flavor, outcome: passFail}).then(t => {

      // Add the dice roll to the template
      templateData.roll = t,
      chatData.roll = JSON.stringify(roll);

      // Render the roll template
      renderTemplate(template, templateData).then(content => {
        
        // Update the message content
        chatData.content = content;

        // Hook into Dice So Nice!
        if (game.dice3d) {
          game.dice3d.showForRoll(roll, chatData.whisper, chatData.blind).then(displayed => {
            ChatMessage.create(chatData)
          });
        }
        // Roll normally, add a dice sound
        else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    });
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
