/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import {alternateContainerType, canFit} from "../inventory/inventory.js";

export class TorchbearerActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "actor"],
      template: "systems/torchbearer/templates/actor/actor-sheet.html",
      width: 617,
      height: 848,
      tabs: [
          {
            navSelector: ".sheet-tabs",
            contentSelector: ".sheet-body",
            initial: "description",
          },
          {
            navSelector: ".inventory-tabs",
            contentSelector: ".inventory-body",
            initial: "on-person"
          },
      ],
      dragDrop: [{dragSelector: ".items-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    if(this.actor.data.type !== 'Character') {
      return data;
    }
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

    // Check skills to see if any can be advanced
    let skillsArray = [];
    const skillList = data.data.skills;
    Object.keys(skillList).forEach(key => {
      skillsArray.push(skillList[key].name);
    });
    skillsArray.forEach(key => {
      if (data.data.skills[key].rating > 0) {
        if (data.data.skills[key].pass >= data.data.skills[key].rating && data.data.skills[key].fail >= data.data.skills[key].rating - 1) {
          ui.notifications.info(`You may now advance ${key} from ${data.data.skills[key].rating} to ${data.data.skills[key].rating + 1}`);
        }
      } else if (data.data.skills[key].rating === 0 && data.data.nature.max > 0) {
        if (data.data.skills[key].pass + data.data.skills[key].fail >= data.data.nature.max) {
          ui.notifications.info(`You may now advance ${key} to 2`);
        }
      }
      
    });

    // Check abilities to see if any can be advanced
    let abilitiesArray = ['will', 'health', 'nature', 'resources', 'circles'];
    let displayArray = ['Will', 'Health', 'Nature', 'Resources', 'Circles'];
    abilitiesArray.forEach((key, index) => {
      if (data.data[key].pass === data.data[key].value && data.data[key].fail === data.data[key].value - 1) {
        ui.notifications.info(`You may now advance ${displayArray[index]} from ${data.data[key].value} to ${data.data[key].value + 1}`);
      }
    });

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
    html.find('.item-name.clickable').click(ev => {
      console.log(ev.currentTarget);
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      // const equip = item.data.data.equip;
      item.sheet.render(true);
    });

    // Update Inventory Item
    html.find('.spell-name.clickable').click(ev => {
      const spell = this.actor.getOwnedItem(ev.currentTarget.title);
      console.log(spell);
      spell.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");

      this.actor.removeItemFromInventory(li.data("itemId")).then(() => {
        // Get the equipment slot of the item being deleted
        li.slideUp(200, () => this.render(false));
      });
    });

    // Delete Spell Item
    html.find('.spell-delete').click(ev => {
      document.getElementById(ev.currentTarget.name).remove();
      this.actor.removeItemFromInventory(ev.currentTarget.name);
    });

    // Update spell data
    html.find('.spell-toggle').click(ev => {
      // ev.preventDefault();
      const spell = this.actor.getOwnedItem(ev.currentTarget.id);
      let checkState = ev.currentTarget.checked;
      console.log(spell);
      switch (ev.currentTarget.title) {
        case 'cast':
          spell.update({"data.cast": checkState});
          break;
        case 'library':
          spell.update({"data.library": checkState});
          break;
        case 'spellbook':
          spell.update({"data.spellbook": checkState});
          break;
        case 'memorized':
          spell.update({"data.memorized": checkState});
          break;
        case 'scroll':
          spell.update({"data.scroll": checkState});
          break;
        case 'supplies':
          spell.update({"data.supplies": checkState});
          break;
      }
    });

    // Drop Inventory Item
    html.find('.item-drop').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      let tbItem = this.actor.getOwnedItem(li.data("itemId"));
      tbItem.update({
        data: {
          equip: "On Ground",
          carried: "Ground",
          slots: 1,
        }
      }).then(() => {
        setTimeout(() => {
          this.actor._onUpdate({items: true});
        }, 0);
      })
    });

    // Drink Item
    html.find('.item-consume').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      let tbItem = this.actor.getOwnedItem(li.data("itemId"));
      tbItem.consumeOne().then(() => {
        setTimeout(() => {
          this.actor._onUpdate({items: true});
        }, 0);
      });
    });

    // Activate Item
    html.find('.item-activate').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      let tbItem = this.actor.getOwnedItem(li.data("itemId"));
      tbItem.toggleActive().then(() => {
        setTimeout(() => {
          this.actor._onUpdate({items: true});
        }, 0);
      });
    });

    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));

    // Event listener for advancing abilities
    html.find('.advanceAbility').click(ev => {
      console.log(ev.currentTarget.innerText);
    });

    // Event listener for advancing skills
    html.find('.advanceSkill').click(ev => {
      let skill = ev.currentTarget.innerText;

      if (this.actor.data.data.skills[skill].rating > 0) {
        
        // If skill can be advanced, do so then clear passes and failures
        if (this.actor.data.data.skills[skill].pass >= this.actor.data.data.skills[skill].rating && this.actor.data.data.skills[skill].fail >= this.actor.data.data.skills[skill].rating - 1) {

          let update = {
            ['data.skills.' + skill + '.rating']: this.actor.data.data.skills[skill].rating + 1,
            ['data.skills.' + skill + '.pass']: 0,
            ['data.skills.' + skill + '.fail']: 0
          };

          this.actor.update(update);
        }
      } else if (this.actor.data.data.skills[skill].rating === 0) {
        if (this.actor.data.data.skills[skill].pass + this.actor.data.data.skills[skill].fail >= this.actor.data.data.nature.max) {
          let update = {
            ['data.skills.' + skill + '.rating']: 2,
            ['data.skills.' + skill + '.pass']: 0,
            ['data.skills.' + skill + '.fail']: 0
          };
          this.actor.update(update);
        }
      }
    });

    html.find('#overburdenToggle').click(() => {
      this.actor.update({
        data: {
          overburdened: !this.actor.tbData().overburdened
        }
      });
    });

    html.find('#primary-tab-inventory').click(() => {
      setTimeout(() => {
        this._tabs[1].activate(this._tabs[1].active, true);
      }, 0);
    });

    // // Event listener for advancing skills
    // html.find('.rollable').click(this._advanceSkill.bind(this));

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
    
    const header = event.currentTarget;

    // Get the type of item to create.
    const type = header.dataset.type;
    
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
    this.actor.data.data.lastTest = rollTarget;

    // Determine if rollTarget is a skill
    let skill = this.isSkill(rollTarget);

    // Determine if double-tapping Nature is an option
    let doubleTap = false;
    if (skill === false || skill.rating === 0) {
      doubleTap = true;
    }

    // Capitalize first letter for later use in the roll template
    let header = 'Testing: ' + rollTarget.charAt(0).toUpperCase() + rollTarget.slice(1);

    // Determine if the actor is Fresh
    let freshCheck = "";
    if (this.actor.data.data.fresh === true) {
      freshCheck = "checked";
    }

    // Dialog box for roll customization
    let dialogContent = 'systems/torchbearer/templates/roll-dialog-content.html';
    
    // Build an actor trait list to be passed to the dialog box
    let traits = [];
    const traitList = this.actor.data.data.traits;
    Object.keys(traitList).forEach(key => {
      if (traitList[key].name != "") {
        traits.push(traitList[key].name);
      }
    });

    // Build a Nature descriptor list to be passed to the dialog box
    let natureDesc = this.actor.data.data.natureDescriptors.split(', ');
    natureDesc.push("Acting outside character's nature");

    renderTemplate(dialogContent, {attribute: header, traitList: traits, fresh: freshCheck, natureDoubleTap: doubleTap, natureDesc: natureDesc}).then(template => {
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
              let ob;
              if (isNaN(parseInt(html.find('#ob')[0].value))) {
                ob = 0;
              } else {
                ob = parseInt(parseInt(html.find('#ob')[0].value));
              }
              let nature = html.find('#natureYes')[0].checked;
              let natureDoubleTap;
              if (html.find('#doubletapYes')[0] === undefined) {
                natureDoubleTap = false;
              } else {
                natureDoubleTap = html.find('#doubletapYes')[0].checked;
              }
              let supplies = html.find('#supplies')[0].value;
              let persona = html.find('#personaAdvantage')[0].value;
              let natureDescriptor = html.find('#natureDesc')[0].value;
              let trait = {
                name: html.find('#traitDropdown')[0].value,
                usedFor: html.find('#traitFor')[0].checked,
                usedAgainst: html.find('#traitAgainst')[0].checked,
                usedAgainstExtra: html.find('#traitAgainstExtra')[0].checked
              };
              this.tbRoll(rollTarget, flavor, header, help, ob, trait, nature, natureDoubleTap, freshCheck, supplies, persona, natureDescriptor);
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

  isSkill(rollTarget) {
    // Create an array of skills for the if check below
    let skills = [];
    const skillList = this.actor.data.data.skills;
    Object.keys(skillList).forEach(key => {
      skills.push(skillList[key].name);
    });

    let skillInfo = {
      "name": "",
      "rating": 0,
      "blAbility": ""
    };

    skills.forEach(key => {
      if (rollTarget === key) {
        skillInfo.name = rollTarget;
        skillInfo.rating = this.actor.data.data.skills[rollTarget].rating;
        skillInfo.blAbility = this.actor.data.data.skills[rollTarget].bl;
      }
    });

    if (skillInfo.name === "") {
      return false;
    } else {
      return skillInfo;
    }
  }

  whichTrait(trait) {
    let temp = '';
    let traitFinder = this.actor.data.data.traits;
    Object.keys(traitFinder).forEach((key, index) => {
      if (trait.name === traitFinder[key].name) {
        temp = `trait${index+1}`;
      }
    });
    return temp;
  }

  tbRoll(rollTarget, flavor, header, help, ob, trait, nature, natureDoubleTap, freshCheck, supplies, persona, natureDescriptor) {

    // Check for any factors due to conditions
    let adjustedStats = this.conditionMods();
    
    // Exhausted is a factor in all tests except Circles and Resources
    if (this.actor.data.data.exhausted === true) {
      if (rollTarget != 'circles' && rollTarget != 'resources') {
        ob = parseInt(ob) + 1;
      }
    }

    // Check to see if the Fresh bonus should be applied
    let freshMod = 0;
    if (freshCheck === "checked") {
      freshMod = 1;
    }
    
    // Set supplies to zero if it's NaN
    let suppliesMod;
    if (isNaN(parseInt(supplies))) {
      suppliesMod = 0;
    } else {
      suppliesMod = parseInt(supplies);
    }

    // Set help to zero if it's NaN
    let helpMod;
    if (isNaN(parseInt(help))) {
      helpMod = 0;
    } else {
      helpMod = parseInt(help);
    }

    // Determine if and how a Trait is being used
    let traitMod = 0;
    let abort = false;
    if (trait.name != "") {
      if (trait.usedFor === true) {
        // Make sure the Trait is able to be used beneficially
        let traitFinder = this.actor.data.data.traits;
        Object.keys(traitFinder).forEach((key, index) => {
          if (trait.name === traitFinder[key].name) {
            if (traitFinder[key].level.value === "1") {
              // Return if the trait has already been used this session, else check it off
              if (traitFinder[key].uses.level1.use1 === true) {
                abort = true;
                ui.notifications.error(`ERROR: You've already used ${trait.name} this session`);
              } else if (this.actor.data.data.angry === true) {
                abort = true;
                ui.notifications.error(`ERROR: You've can't use ${trait.name} to help when you're angry`);
              } else {
                let temp = `trait${index+1}`;
                switch (temp) {
                  case 'trait1':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait1.uses.level1.use1': true});
                    break;
                  case 'trait2':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait2.uses.level1.use1': true});
                    break;
                  case 'trait3':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait3.uses.level1.use1': true});
                    break;
                  case 'trait4':
                  traitMod = 1;
                  this.actor.update({'data.traits.trait4.uses.level1.use1': true});
                  break;
                }
              }
            } else if (traitFinder[key].level.value === "2") {
              if (traitFinder[key].uses.level1.use1 === true && traitFinder[key].uses.level2.use2 === true) {
                abort = true;
              } else if (this.actor.data.data.angry === true) {
                abort = true;
                ui.notifications.error(`ERROR: You've can't use ${trait.name} to help when you're angry`);
              } else if (traitFinder[key].uses.level1.use1 === false) {
                let temp = `trait${index+1}`;
                switch (temp) {
                  case 'trait1':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait1.uses.level1.use1': true});
                    break;
                  case 'trait2':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait2.uses.level1.use1': true});
                    break;
                  case 'trait3':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait3.uses.level1.use1': true});
                    break;
                  case 'trait4':
                  traitMod = 1;
                  this.actor.update({'data.traits.trait4.uses.level1.use1': true});
                  break;
                }
              } else if (traitFinder[key].uses.level2.use2 === false) {
                let temp = `trait${index+1}`;
                switch (temp) {
                  case 'trait1':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait1.uses.level2.use2': true});
                    break;
                  case 'trait2':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait2.uses.level2.use2': true});
                    break;
                  case 'trait3':
                    traitMod = 1;
                    this.actor.update({'data.traits.trait3.uses.level2.use2': true});
                    break;
                  case 'trait4':
                  traitMod = 1;
                  this.actor.update({'data.traits.trait4.uses.level2.use2': true});
                  break;
                }
              }
            }
          } 
        });
      } else if (trait.usedAgainst === true) {
        traitMod = -1;
        // Add checks to the actor sheet
        let traitNum = this.whichTrait(trait);
        switch(traitNum) {
          case 'trait1':
            this.actor.update({'data.traits.trait1.checks.checksEarned': parseInt(this.actor.data.data.traits.trait1.checks.checksEarned + 1)});
            break;
          case 'trait2':
            this.actor.update({'data.traits.trait2.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 1)});
            break;
          case 'trait3':
            this.actor.update({'data.traits.trait3.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 1)});
            break;
          case 'trait4':
            this.actor.update({'data.traits.trait4.checks.checksEarned': parseInt(this.actor.data.data.traits.trait4.checks.checksEarned + 1)});
            break;
        }
      } else if (trait.usedAgainstExtra === true) {
        traitMod = -2;
        // Add a check to the actor sheet
        let traitNum = this.whichTrait(trait);
        switch(traitNum) {
          case 'trait1':
            this.actor.update({'data.traits.trait1.checks.checksEarned': parseInt(this.actor.data.data.traits.trait1.checks.checksEarned + 2)});
            break;
          case 'trait2':
            this.actor.update({'data.traits.trait2.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 2)});
            break;
          case 'trait3':
            this.actor.update({'data.traits.trait3.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 2)});
            break;
          case 'trait4':
            this.actor.update({'data.traits.trait4.checks.checksEarned': parseInt(this.actor.data.data.traits.trait4.checks.checksEarned + 2)});
            break;
        }
      }
    }

    // Stop the roll if the user is trying to use a trait that's already been used this session
    if (abort === true) {
      return;
    }

    // Check to see if persona points are spent to add +XD
    let personaMod = 0;
    if (persona != "" && this.actor.data.data.persona.value >= parseInt(persona)) {
      personaMod = parseInt(persona);
      this.actor.update({'data.persona.value': this.actor.data.data.persona.value - personaMod});
      this.actor.update({'data.persona.spent': this.actor.data.data.persona.spent + personaMod});
    } else if (persona != "" && this.actor.data.data.persona.value < parseInt(persona)) {
      ui.notifications.error("ERROR: You don't have enough persona to spend.");
      return;
    }

    // Determine if Nature has been tapped. If so, add Nature to roll and deduce 1 persona point.
    let natureMod = 0;
    if (nature === true && this.actor.data.data.persona.value < 1) {
      ui.notifications.error("ERROR: You don't have any persona to spend.");
      return;
    } else if (nature === true && this.actor.data.data.persona.value >= 1) {
      natureMod = this.actor.data.data.nature.value;
      this.actor.update({'data.persona.value': this.actor.data.data.persona.value - 1});
      this.actor.update({'data.persona.spent': this.actor.data.data.persona.spent + 1});
    } else if (natureDoubleTap === true && this.actor.data.data.persona.value >= 1) {
      natureMod = this.actor.data.data.nature.value;
      this.actor.update({'data.persona.value': this.actor.data.data.persona.value - 1});
      this.actor.update({'data.persona.spent': this.actor.data.data.persona.spent + 1});
    }
    
    // Create an array of skills for the if check below
    let skills = [];
    const skillList = this.actor.data.data.skills;
    Object.keys(skillList).forEach(key => {
      skills.push(skillList[key].name);
    });

    // Determine number of dice to roll. 
    let diceToRoll;
    let beginnersLuck = "";
    
    // Is the thing being rolled a skill?
    skills.forEach(key => {
      if (rollTarget === key) {
        this.actor.data.data.isLastTestSkill = true;
        if (natureDoubleTap === false) {
          // Check for Beginner's Luck
          if (this.actor.data.data.skills[rollTarget].rating === 0 && this.actor.data.data.afraid === true) {
            ui.notifications.error("You can't use Beginner's Luck when you're afraid");
            abort = true;
          } else if (this.actor.data.data.skills[rollTarget].rating === 0 && this.actor.data.data.afraid === false) {
            let blAbility = this.actor.data.data.skills[rollTarget].bl;
            if (blAbility === "W") {
              // If Will is not zero, roll Beginner's Luck as normal
              if (this.actor.data.data.will.value != 0) {
                beginnersLuck = "(Beginner's Luck, Will)";
                diceToRoll = Math.ceil((adjustedStats.will + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
              } else if (this.actor.data.data.will.value === 0) {
                // If Will is zero, use Nature instead
                beginnersLuck = "(Beginner's Luck, Nature)";
                diceToRoll = Math.ceil((adjustedStats.nature + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
              }
            } else if (blAbility === "H") {
              // If Health is not zero, roll Beginner's Luck as normal
              if (this.actor.data.data.health.value != 0) {
                beginnersLuck = "(Beginner's Luck, Health)";
                diceToRoll = Math.ceil((adjustedStats.health + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
              } else if (this.actor.data.data.will.value === 0) {
                // If Health is zero, use Nature instead
                beginnersLuck = "(Beginner's Luck, Nature)";
                diceToRoll = Math.ceil((adjustedStats.nature + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
              }
            }
          } else {
            diceToRoll = this.actor.data.data.skills[rollTarget].rating + traitMod + natureMod + freshMod + suppliesMod + helpMod + personaMod + adjustedStats.skillMod;
          }
        } else if (natureDoubleTap === true) {
          diceToRoll = adjustedStats.nature + suppliesMod + helpMod + traitMod + natureMod + freshMod + personaMod;
        }
      }
    });

    if (abort === true) {
      return;
    }

    // Otherwise it's an ability
    if (diceToRoll === undefined) {
      this.actor.data.data.isLastTestSkill = false;
      if (natureDoubleTap === false) {
        diceToRoll = adjustedStats[rollTarget] + traitMod + natureMod + freshMod + suppliesMod + helpMod + personaMod;
      } else if (natureDoubleTap === true) {
        diceToRoll = adjustedStats.nature + suppliesMod + helpMod + traitMod + natureMod + freshMod + personaMod;
      }
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
      bL: beginnersLuck,
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
    roll.parts[0].options.ob = ob;

    //Create an array of the roll results
    let rollResult = [];
    let sixes = 0;
    let scoundrels = 0;
    helpMod += suppliesMod;
    roll.parts[0].rolls.forEach((key, index) => {
      let tempObj = {result: key.roll, style: ''};
      if (key.roll === 6) {
        tempObj.style = ' max'
        sixes++;
      }
      if (key.roll < 4) {
        scoundrels++;
      }
      if (helpMod != 0 && index >= (diceToRoll-helpMod-natureMod-personaMod)) {
        let temp = tempObj.style
        temp += ' help';
        tempObj.style = temp;
      }
      if (natureMod != 0 && index >= (diceToRoll-natureMod-personaMod)) {
        let temp = tempObj.style
        temp += ' nature';
        tempObj.style = temp;
      }
      if (personaMod != 0 && index >= (diceToRoll-personaMod)) {
        let temp = tempObj.style
        temp += ' persona';
        tempObj.style = temp;
      }
      rollResult.push(tempObj);
    });

    // Only loads these values if Fate and Persona are available to spend. Without these values
    // being set, the buttons won't show up under the roll.
    if (this.actor.data.data.fate.value != 0) {
      templateData.rerollsAvailable = sixes;
    }
    if (this.actor.data.data.persona.value != 0) {
      templateData.scoundrelsAvailable = scoundrels;
    }

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

    let passFail = ' - Fail!';
    roll.parts[0].options.rollOutcome = 'fail';
    if (ob === 0 && rolledSuccesses > ob) {
      passFail = ' - Pass!'
      roll.parts[0].options.rollOutcome = 'pass';
    } else if (ob > 0 && rolledSuccesses >= ob) {
      passFail = ' - Pass!'
      roll.parts[0].options.rollOutcome = 'pass';
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
          game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => {
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

  conditionMods() {
    let adjustedStats = {
      'will': this.actor.data.data.will.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
      'health': this.actor.data.data.health.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
      'nature': this.actor.data.data.nature.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
      'skillMod': 0 - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0)
    }

    return adjustedStats;
  }

  closestCompatibleContainer(tbItem, target) {
    let $closestContainer = $(target).closest('.inventory-container');
    if(!$closestContainer.length) {
      return {};
    }
    const containerType = $closestContainer.data('containerType');
    const containerId = $closestContainer.data('itemId');
    if(tbItem.isCompatibleContainer(containerType)) {
      return {
        containerType,
        containerId: containerId || '',
        slotsTaken: tbItem.slotsTaken(containerType),
      };
    } else {
      return this.closestCompatibleContainer(tbItem, $closestContainer.parent());
    }
  }

  pickAnotherContainerIfNecessaryDueToItemSize(item) {
    if(!canFit(item, item.data.data.equip, this.actor.data.data.computed.inventory)) {
      if(canFit(item, alternateContainerType(item), this.actor.data.data.computed.inventory)) {
        return alternateContainerType(item);
      }
    }
  }

  /** @override */
  async _onDrop(event) {
    let item = await super._onDrop(event);
    console.log(item);
    if(this.actor.data.type !== 'Character') return;

    let tbItem;
    if(item._id) {
      tbItem = this.actor.items.get(item._id);
    } else {
      tbItem = item;
    }

    if (tbItem.type === "Spell") {
      console.log('Yer a wizard, Harry');
    } else {
      if(tbItem.data) {
        await tbItem.syncEquipVariables();
  
        let oldContainerId = tbItem.data.data.containerId;
        let {containerType, containerId, slotsTaken} = this.closestCompatibleContainer(tbItem, event.target);
        if(!containerType) {
          //No closest container specified, so pick one.
          // First, we know it's not pack w/o a containerId, so if it is the item's gonna need
          // updating.
          if(tbItem.data.data.equip === 'Pack') {
            tbItem.data.data.equip = tbItem.data.data.equipOptions.option1.value;
            tbItem.data.data.slots = tbItem.data.data.slotOptions.option1.value;
            containerType = tbItem.data.data.equip;
            containerId = null;
            slotsTaken = tbItem.data.data.slots;
          }
          let newContainerType = this.pickAnotherContainerIfNecessaryDueToItemSize(tbItem);
          if(newContainerType) {
            slotsTaken = tbItem.slotsTaken(newContainerType);
            containerType = newContainerType;
          }
        }
        if(containerType) {
          let update = {data: {equip: containerType, containerId: containerId, slots: slotsTaken}};
          await tbItem.update(update);
          await tbItem.onAfterEquipped({containerType, containerId});
          this.actor._onUpdate({items: true});
          if(oldContainerId) {
            let oldContainer = this.actor.items.get(oldContainerId);
            setTimeout(() => {
              oldContainer.sheet.render(false);
            }, 0)
          }
          if(containerId) {
            let newContainer = this.actor.items.get(containerId);
            setTimeout(() => {
              newContainer.sheet.render(false);
            }, 0)
          }
        }
      }
    }

    return tbItem;
  }

  /** @override */
  _onSortItem(event, itemData) {
    super._onSortItem(event, itemData);
    let item = this.actor.items.get(itemData._id);
    return item.data;
  }
}
