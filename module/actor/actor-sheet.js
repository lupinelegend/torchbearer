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
    let title = rollTarget.charAt(0).toUpperCase() + rollTarget.slice(1);

    // Determine number of dice to roll
    let diceToRoll = this.actor.data.data[rollTarget].value;

    // Build the formula
    let formula = `${diceToRoll}d6`;

    // Render the roll
    let template = 'systems/torchbearer/templates/torchbearer-roll.html';

    // GM rolls
    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    };
    let templateData = {
      title: title,
      flavor: 'This is a dice roll!',
      roll: {}
    };

    // Handle roll visibility. Blind doesn't work; you'll need a render hook to hide it
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

    console.log(rollResult);

    // Count successes
    let rolledSuccesses = 0;
    rollResult.forEach((index) => {
      if (index.result > 3) {
        rolledSuccesses++;
      }
    });

    renderTemplate('systems/torchbearer/templates/roll-template.html', {results: rollResult, dice: diceToRoll, success: rolledSuccesses}).then(t => {

      console.log(t);

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

    // console.log(roll);

    // --- Using Roll() ---
    // let dicePool = new Roll(`${diceToRoll}d6`,{});
    // let label = rollTarget ? `Rolling ${rollTarget}` : '';
    // dicePool.roll().toMessage({
    //   speaker: ChatMessage.getSpeaker({actor: this.actor}),
    //   flavor: label,
    //   type: CONST.CHAT_MESSAGE_TYPES.OOC
    // });
    // let rolls = dicePool.parts[0].rolls;

    // // Sort rolls from lowest to highest. Also creates an array of numbers from an array of objects
    // let sorted_rolls = rolls.map(i => i.roll).sort();
    // console.log(sorted_rolls);

    // // Count successes
    // let rolledSuccesses = 0;
    // sorted_rolls.forEach((index) => {
    //   if (index > 3) {
    //     rolledSuccesses++;
    //   }
    // });

    // console.log(rolledSuccesses);
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
          if (slots > this.actor.data.data.Head.wornSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn on your head.');
            return;
          } else if (slots > this.actor.data.data.Head.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough Head inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Head.wornSlotsAvailable': this.actor.data.data.Head.wornSlotsAvailable - slots});
          }
          break;
        case "Neck":
          if (slots > this.actor.data.data.Neck.wornSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn around your neck.');
            return;
          } else if (slots > this.actor.data.data.Neck.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough Neck inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Neck.wornSlotsAvailable': this.actor.data.data.Neck.wornSlotsAvailable - slots});
          }
          break;
        case "Hands (Worn)":
          if (slots > this.actor.data.data.Hands.wornSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn on your hands.');
            return;
          } else if (slots > this.actor.data.data.Hands.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough Hands (Worn) inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Hands.wornSlotsAvailable': this.actor.data.data.Hands.wornSlotsAvailable - slots});
          }
          break;
        case "Hands (Carried)":
          if (slots > this.actor.data.data.Hands.carriedSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn on your hands.');
            return;
          } else if (slots > this.actor.data.data.Hands.carriedSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough Hands (Carried) inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Hands.carriedSlotsAvailable': this.actor.data.data.Hands.carriedSlotsAvailable - slots});
          }
          break;
        case "Feet":
          if (slots > this.actor.data.data.Feet.wornSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn on your feet.');
            return;
          } else if (slots > this.actor.data.data.Feet.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough feet inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Feet.wornSlotsAvailable': this.actor.data.data.Feet.wornSlotsAvailable - slots});
          }
          break;
        case "Torso":
          if (slots > this.actor.data.data.Torso.wornSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn on your torso.');
            return;
          } else if (slots > this.actor.data.data.Torso.wornSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough Torso inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Torso.wornSlotsAvailable': this.actor.data.data.Torso.wornSlotsAvailable - slots});
          }
          break;
        case "Belt":
          if (slots > this.actor.data.data.Belt.packSlotsTotal) {
            ui.notifications.error('ERROR: Item too large to be worn on your belt.');
            return;
          } else if (slots > this.actor.data.data.Belt.packSlotsAvailable) {
            ui.notifications.error('ERROR: Not enough Belt inventory slots available.');
            return;
          } else {
            this.actor.update({'data.Belt.packSlotsAvailable': this.actor.data.data.Belt.packSlotsAvailable - slots});
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
