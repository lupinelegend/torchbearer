export class conflictSheet extends Application {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Conflict Sheet",
      classes: ["torchbearer", "sheet", "conflict"],
      template: "systems/torchbearer/templates/conflict-template.html",
      width: 1050,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "setup" }],
      dragDrop: [{dragSelector: null, dropSelector: null}]
    });
  }

  /** @override */
  async getData() {
    let data = super.getData();

    data.conflict = await this.currentConflict();

    if(game.user.isGM) {
      data.isGM = true;
    }
    data.computed = {};
    // Create an array of actor names

    this._conflictData = data;
    return data;
  }


  async loadChars() {
    if(game.user.isGM) {
      let actorIds = (await game.grind.currentGrind()).actors;
      if(actorIds.length === 0) {
        actorIds = [];
        for(let i = 0; i < game.actors.entities.length; i++) {
          let actor = game.actors.entities[i];
          if(actor.data.type === 'Character') {
            actorIds.push(actor._id);
          }
        }
      }
      let engagedCharacterActors = {};
      for(let i = 0; i < actorIds.length; i++) {
        let actorId = actorIds[i];
        let tbActor = game.actors.get(actorId);
        let char = {
          name: tbActor.name,
          id: actorId,
          weapons: [],
          equipped: '',
          dispo: 0,
        }
        let j = 0;
        let weaponArray = [];

        while (j < tbActor.tbData().computed.inventory['Hands (Carried)'].slots.length) {
          weaponArray.push(tbActor.tbData().computed.inventory['Hands (Carried)'].slots[j]);
          j++;
        }
        weaponArray = weaponArray.concat(Object.keys(tbActor.tbData().computed.spells).reduce((accum, circle) => {
          return accum.concat(tbActor.tbData().computed.spells[circle].map(tbItem => tbItem.data))
        }, []));

        char.weapons = weaponArray;
        engagedCharacterActors[actorId] = char;
      }
      let currentConflict = await this.currentConflict();
      let newEngagedActors = Object.assign({}, duplicate(currentConflict).engagedActors, engagedCharacterActors);
      await this.updateConflict({partyOrder: actorIds, engagedActors: newEngagedActors}, 'loadChars');
    }
  }
  async currentConflict() {
    let currentConflict = await game.settings.get('conflict-sheet', 'currentConflict');
    if (!currentConflict || currentConflict.dataType !== 'conflict') {
      return await this.resetConflict();
    }
    return currentConflict;
  }

  async resetConflict() {
    if(game.user.isGM) {
      const newConflict = {
        dataType: 'conflict',
        rounds: [],
        partyOrder: [],
        enemyOrder: [],
        engagedActors: {},
        partyIntent: '',
        opponentIntent: '',
        conflictCaptain: '',
        opponentName: '',
        partyDispoCurrent: 0,
        partyDispoMax: 0,
        opponentDispoCurrent: 0,
        opponentDispoMax: 0,
        active: true,
      };
      await this.updateConflict(newConflict, 'resetConflict');
      return newConflict;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.conflict-field').change(ev => {
      let $target = $(ev.target);
      const fieldName = $target.attr('name');
      const dtype = $target.data('dtype');
      let value = $target.val();
      if('Number' === dtype) {
        value = parseInt(value);
      }
      this.updateConflict({[fieldName]: value}, 'conflict.conflict-field');
    });

    html.find('.conflict-actor-field').change(ev => {
      let $target = $(ev.target);
      const fieldName = $target.attr('name');
      const dtype = $target.data('dtype');
      let actorID = $target.closest('.actor').data('actorId');
      let value = $target.val();
      if('Number' === dtype) {
        value = parseInt(value);
      }

      let engagedActors = duplicate(this._conflictData.conflict.engagedActors);
      engagedActors[actorID][fieldName] = value;

      this.updateConflict({engagedActors: engagedActors}, 'conflict.actor-field')
    });

    html.find('#dispoHeader').click(ev => {
      this.dispoDialog();
    });

    html.find('#logConflict').on('click', async () => {
      console.log(this._conflictData);
    });
    html.find('#reloadTemplate').on('click', () => {
      delete(_templateCache[this.options.template]);
      this.render(true);
    });
    html.find('#resetConflict').on('click', async () => {
      await this.resetConflict();
      this.loadChars();
    });
    html.find('#loadChars').on('click', async () => {
      this.loadChars();
    });
    html.find('.actor .actor-image, .actor .actor-name').on('click', (evt) => {
      game.actors.get($(evt.target).closest('.actor').data('actorId')).sheet.render(true);
  });

  }

  /** @override */
  async _onDrop(event) {
    // Try to extract the data
    let data;
    try {
        data = JSON.parse(event.dataTransfer.getData('text/plain'));
        console.log(data);
        if (data.type !== "Monster") return;
    } catch (err) {
      console.log('error');
      return false;
    }
    console.log(event);
    //await this._onSortPartyMember(event, data.data);
  }

  dispoDialog() {
    if (game.user.isGM) {
      console.log('Greetings, GM!');

      // Create an array of actors
      let actorArray = [];
      game.actors._source.forEach((element, index) => {
        if (element.type === 'Character') {
          let char = {
            name: element.name,
            id: element._id,
            hungry: element.data.hungryandthirsty,
            exhausted: element.data.exhausted
          }
          actorArray.push(char);
        }
      });

      // Is anyone Hungry & Thirsty? Is the Conflict Captain exhausted?
      let conflictCaptain = this._conflictData.conflict.conflictCaptain;
      let hungry = false;
      let exhausted = false;
      actorArray.forEach(element => {
        if (element.hungry === true) {
          hungry = true;
        }
        if (element.name === conflictCaptain) {
          if (element.exhausted === true) {
            exhausted = true;
          }
        }
      });

      // Create an array of Conflict types and skills/abilities for Disposition
      let conflictTypes = [
        {
          name: 'Banish/Abjure',
          skill: {
            1: 'Arcanist',
            2: 'Ritualist'
          },
          ability: 'Will'
        },
        {
          name: 'Capture',
          skill: {
            1: 'Fighter',
            2: 'Hunter'
          },
          ability: 'Will'
        },
        {
          name: 'Convince',
          skill: {
            1: 'Persuader'
          },
          ability: 'Will'
        },
        {
          name: 'Convince Crowd',
          skill: {
            1: 'Orator'
          },
          ability: 'Will'
        },
        {
          name: 'Drive Off',
          skill: {
            1: 'Fighter'
          },
          ability: 'Health'
        },
        {
          name: 'Kill',
          skill: {
            1: 'Fighter'
          },
          ability: 'Health'
        },
        {
          name: 'Pursue/Flee',
          skill: {
            1: 'Scout',
            2: 'Rider'
          },
          ability: 'Health'
        },
        {
          name: 'Trick/Riddle',
          skill: {
            1: 'Manipulator'
          },
          ability: 'Will'
        },
        {
          name: 'Other'
        }
      ];

      // Dialog box for roll customization
      let dialogContent = 'systems/torchbearer/templates/disposition-roll-template.html';

      // Render the roll dialog
      renderTemplate(dialogContent, {conflictTypes: conflictTypes, hungry: hungry, exhausted: exhausted}).then(template => {
        new Dialog({
          title: `Disposition`,
          content: template,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Roll`,
              callback: (html) => {
                let type = html.find('#conflictType')[0].value;
                let skill = html.find('#skillRoll')[0].value;
                let help = html.find('#help')[0].value;
                let otherSkill = html.find('#skill')[0].value;
                let otherAbility = html.find('#ability')[0].value;
                this.rollDispo(type, skill, help, otherSkill, otherAbility, hungry, exhausted, conflictCaptain);
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
    } else {
      console.log('Hey, pleb.');
    }
  }

  rollDispo(type, skill, help, otherSkill, otherAbility, hungry, exhausted, conflictCaptain) {
    console.log(conflictCaptain);

    let roller;
    game.actors._source.forEach(element => {
      if (element.name === conflictCaptain) {
        roller = element._id;
      }
    });

    console.log(roller);
    
    // Check for any factors due to conditions
    // let adjustedStats = {
    //   'will': this.actor.data.data.will.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
    //   'health': this.actor.data.data.health.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
    //   'nature': this.actor.data.data.nature.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
    //   'skillMod': 0 - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0)
    // }

    // // Check to see if the Fresh bonus should be applied
    // let freshMod = 0;
    // if (freshCheck === "checked") {
    //   freshMod = 1;
    // }

    // // Set help to zero if it's NaN
    // let helpMod;
    // if (isNaN(parseInt(help))) {
    //   helpMod = 0;
    // } else {
    //   helpMod = parseInt(help);
    // }

  //   // Determine if and how a Trait is being used
  //   let traitMod = 0;
  //   let abort = false;
  //   if (trait.name != "") {
  //     if (trait.usedFor === true) {
  //       // Make sure the Trait is able to be used beneficially
  //       let traitFinder = this.actor.data.data.traits;
  //       Object.keys(traitFinder).forEach((key, index) => {
  //         if (trait.name === traitFinder[key].name) {
  //           if (traitFinder[key].level.value === "1") {
  //             // Return if the trait has already been used this session, else check it off
  //             if (traitFinder[key].uses.level1.use1 === true) {
  //               abort = true;
  //               ui.notifications.error(`ERROR: You've already used ${trait.name} this session`);
  //             } else if (this.actor.data.data.angry === true) {
  //               abort = true;
  //               ui.notifications.error(`ERROR: You've can't use ${trait.name} to help when you're angry`);
  //             } else {
  //               let temp = `trait${index+1}`;
  //               switch (temp) {
  //                 case 'trait1':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait1.uses.level1.use1': true});
  //                   break;
  //                 case 'trait2':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait2.uses.level1.use1': true});
  //                   break;
  //                 case 'trait3':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait3.uses.level1.use1': true});
  //                   break;
  //                 case 'trait4':
  //                 traitMod = 1;
  //                 this.actor.allUpdates({'data.traits.trait4.uses.level1.use1': true});
  //                 break;
  //               }
  //             }
  //           } else if (traitFinder[key].level.value === "2") {
  //             if (traitFinder[key].uses.level1.use1 === true && traitFinder[key].uses.level2.use2 === true) {
  //               abort = true;
  //             } else if (this.actor.data.data.angry === true) {
  //               abort = true;
  //               ui.notifications.error(`ERROR: You've can't use ${trait.name} to help when you're angry`);
  //             } else if (traitFinder[key].uses.level1.use1 === false) {
  //               let temp = `trait${index+1}`;
  //               switch (temp) {
  //                 case 'trait1':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait1.uses.level1.use1': true});
  //                   break;
  //                 case 'trait2':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait2.uses.level1.use1': true});
  //                   break;
  //                 case 'trait3':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait3.uses.level1.use1': true});
  //                   break;
  //                 case 'trait4':
  //                 traitMod = 1;
  //                 this.actor.allUpdates({'data.traits.trait4.uses.level1.use1': true});
  //                 break;
  //               }
  //             } else if (traitFinder[key].uses.level2.use2 === false) {
  //               let temp = `trait${index+1}`;
  //               switch (temp) {
  //                 case 'trait1':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait1.uses.level2.use2': true});
  //                   break;
  //                 case 'trait2':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait2.uses.level2.use2': true});
  //                   break;
  //                 case 'trait3':
  //                   traitMod = 1;
  //                   this.actor.allUpdates({'data.traits.trait3.uses.level2.use2': true});
  //                   break;
  //                 case 'trait4':
  //                 traitMod = 1;
  //                 this.actor.allUpdates({'data.traits.trait4.uses.level2.use2': true});
  //                 break;
  //               }
  //             }
  //           }
  //         } 
  //       });
  //     } else if (trait.usedAgainst === true) {
  //       traitMod = -1;
  //       // Add checks to the actor sheet
  //       let traitNum = this.whichTrait(trait);
  //       switch(traitNum) {
  //         case 'trait1':
  //           this.actor.allUpdates({'data.traits.trait1.checks.checksEarned': parseInt(this.actor.data.data.traits.trait1.checks.checksEarned + 1)});
  //           break;
  //         case 'trait2':
  //           this.actor.allUpdates({'data.traits.trait2.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 1)});
  //           break;
  //         case 'trait3':
  //           this.actor.allUpdates({'data.traits.trait3.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 1)});
  //           break;
  //         case 'trait4':
  //           this.actor.allUpdates({'data.traits.trait4.checks.checksEarned': parseInt(this.actor.data.data.traits.trait4.checks.checksEarned + 1)});
  //           break;
  //       }
  //     } else if (trait.usedAgainstExtra === true) {
  //       traitMod = -2;
  //       // Add a check to the actor sheet
  //       let traitNum = this.whichTrait(trait);
  //       switch(traitNum) {
  //         case 'trait1':
  //           this.actor.allUpdates({'data.traits.trait1.checks.checksEarned': parseInt(this.actor.data.data.traits.trait1.checks.checksEarned + 2)});
  //           break;
  //         case 'trait2':
  //           this.actor.allUpdates({'data.traits.trait2.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 2)});
  //           break;
  //         case 'trait3':
  //           this.actor.allUpdates({'data.traits.trait3.checks.checksEarned': parseInt(this.actor.data.data.traits.trait3.checks.checksEarned + 2)});
  //           break;
  //         case 'trait4':
  //           this.actor.allUpdates({'data.traits.trait4.checks.checksEarned': parseInt(this.actor.data.data.traits.trait4.checks.checksEarned + 2)});
  //           break;
  //       }
  //     }
  //   }

  //   // Stop the roll if the user is trying to use a trait that's already been used this session
  //   if (abort === true) {
  //     return;
  //   }

  //   // Check to see if persona points are spent to add +XD
  //   let personaMod = 0;
  //   if (persona != "" && this.actor.data.data.persona.value >= parseInt(persona)) {
  //     personaMod = parseInt(persona);
  //     this.actor.allUpdates({'data.persona.value': this.actor.data.data.persona.value - personaMod});
  //     this.actor.allUpdates({'data.persona.spent': this.actor.data.data.persona.spent + personaMod});
  //   } else if (persona != "" && this.actor.data.data.persona.value < parseInt(persona)) {
  //     ui.notifications.error("ERROR: You don't have enough persona to spend.");
  //     return;
  //   }

  //   // Determine if Nature has been tapped. If so, add Nature to roll and deduce 1 persona point.
  //   let natureMod = 0;
  //   if (nature === true && this.actor.data.data.persona.value < 1) {
  //     ui.notifications.error("ERROR: You don't have any persona to spend.");
  //     return;
  //   } else if (nature === true && this.actor.data.data.persona.value >= 1) {
  //     natureMod = this.actor.data.data.nature.value;
  //     this.actor.allUpdates({'data.persona.value': this.actor.data.data.persona.value - 1});
  //     this.actor.allUpdates({'data.persona.spent': this.actor.data.data.persona.spent + 1});
  //   } else if (natureDoubleTap === true && this.actor.data.data.persona.value >= 1) {
  //     natureMod = this.actor.data.data.nature.value;
  //     this.actor.allUpdates({'data.persona.value': this.actor.data.data.persona.value - 1});
  //     this.actor.allUpdates({'data.persona.spent': this.actor.data.data.persona.spent + 1});
  //   }
    
  //   // Create an array of skills for the if check below
  //   let skills = [];
  //   const skillList = this.actor.data.data.skills;
  //   Object.keys(skillList).forEach(key => {
  //     skills.push(skillList[key].name);
  //   });

  //   // Determine number of dice to roll. 
  //   let diceToRoll;
  //   let beginnersLuck = "";
    
  //   // Is the thing being rolled a skill?
  //   skills.forEach(key => {
  //     if (rollTarget === key) {
  //       this.actor.data.data.isLastTestSkill = true;
  //       if (natureDoubleTap === false) {
  //         // Check for Beginner's Luck
  //         if (this.actor.data.data.skills[rollTarget].rating === 0 && this.actor.data.data.afraid === true) {
  //           ui.notifications.error("You can't use Beginner's Luck when you're afraid");
  //           abort = true;
  //         } else if (this.actor.data.data.skills[rollTarget].rating === 0 && this.actor.data.data.afraid === false) {
  //           let blAbility = this.actor.data.data.skills[rollTarget].bl;
  //           if (blAbility === "W") {
  //             // If Will is not zero, roll Beginner's Luck as normal
  //             if (this.actor.data.data.will.value != 0) {
  //               beginnersLuck = "(Beginner's Luck, Will)";
  //               diceToRoll = Math.ceil((adjustedStats.will + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
  //             } else if (this.actor.data.data.will.value === 0) {
  //               // If Will is zero, use Nature instead
  //               beginnersLuck = "(Beginner's Luck, Nature)";
  //               diceToRoll = Math.ceil((adjustedStats.nature + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
  //             }
  //           } else if (blAbility === "H") {
  //             // If Health is not zero, roll Beginner's Luck as normal
  //             if (this.actor.data.data.health.value != 0) {
  //               beginnersLuck = "(Beginner's Luck, Health)";
  //               diceToRoll = Math.ceil((adjustedStats.health + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
  //             } else if (this.actor.data.data.will.value === 0) {
  //               // If Health is zero, use Nature instead
  //               beginnersLuck = "(Beginner's Luck, Nature)";
  //               diceToRoll = Math.ceil((adjustedStats.nature + suppliesMod + helpMod)/2) + traitMod + natureMod + freshMod + personaMod;
  //             }
  //           }
  //         } else {
  //           diceToRoll = this.actor.data.data.skills[rollTarget].rating + traitMod + natureMod + freshMod + suppliesMod + helpMod + personaMod + adjustedStats.skillMod;
  //         }
  //       } else if (natureDoubleTap === true) {
  //         diceToRoll = adjustedStats.nature + suppliesMod + helpMod + traitMod + natureMod + freshMod + personaMod;
  //       }
  //     }
  //   });

  //   if (abort === true) {
  //     return;
  //   }

  //   // Otherwise it's an ability
  //   if (diceToRoll === undefined) {
  //     this.actor.data.data.isLastTestSkill = false;
  //     if (natureDoubleTap === false) {
  //       diceToRoll = adjustedStats[rollTarget] + traitMod + natureMod + freshMod + suppliesMod + helpMod + personaMod;
  //     } else if (natureDoubleTap === true) {
  //       diceToRoll = adjustedStats.nature + suppliesMod + helpMod + traitMod + natureMod + freshMod + personaMod;
  //     }
  //   }

  //   // Build the formula
  //   let formula = `${diceToRoll}d6`;

  //   // Prep the roll template
  //   let template = 'systems/torchbearer/templates/torchbearer-roll.html';

  //   // GM rolls
  //   let chatData = {
  //     user: game.user._id,
  //     speaker: ChatMessage.getSpeaker({ actor: this.actor })
  //   };
  //   let templateData = {
  //     title: header,
  //     flavorText: flavor,
  //     rollDetails: `${diceToRoll}D vs. Ob ${ob}`,
  //     bL: beginnersLuck,
  //     roll: {}
  //   };

  //   // Handle roll visibility. Blind doesn't work; you'll need a render hook to hide it.
  //   let rollMode = game.settings.get("core", "rollMode");
  //   if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
  //   if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
  //   if (rollMode === "blindroll") chatData["blind"] = true;

  //   // Do the roll
  //   let roll = new Roll(formula);
  //   roll.roll();
  //   roll.parts[0].options.ob = ob;

  //   //Create an array of the roll results
  //   let rollResult = [];
  //   let sixes = 0;
  //   let scoundrels = 0;
  //   helpMod += suppliesMod;
  //   roll.parts[0].rolls.forEach((key, index) => {
  //     let tempObj = {result: key.roll, style: ''};
  //     if (key.roll === 6) {
  //       tempObj.style = ' max'
  //       sixes++;
  //     }
  //     if (key.roll < 4) {
  //       scoundrels++;
  //     }
  //     if (helpMod != 0 && index >= (diceToRoll-helpMod-natureMod-personaMod)) {
  //       let temp = tempObj.style
  //       temp += ' help';
  //       tempObj.style = temp;
  //     }
  //     if (natureMod != 0 && index >= (diceToRoll-natureMod-personaMod)) {
  //       let temp = tempObj.style
  //       temp += ' nature';
  //       tempObj.style = temp;
  //     }
  //     if (personaMod != 0 && index >= (diceToRoll-personaMod)) {
  //       let temp = tempObj.style
  //       temp += ' persona';
  //       tempObj.style = temp;
  //     }
  //     rollResult.push(tempObj);
  //   });

  //   // Only loads these values if Fate and Persona are available to spend. Without these values
  //   // being set, the buttons won't show up under the roll.
  //   if (this.actor.data.data.fate.value != 0) {
  //     templateData.rerollsAvailable = sixes;
  //   }
  //   if (this.actor.data.data.persona.value != 0) {
  //     templateData.scoundrelsAvailable = scoundrels;
  //   }

  //   // Count successes
  //   let rolledSuccesses = 0;
  //   let displaySuccesses;
  //   rollResult.forEach((index) => {
  //     if (index.result > 3) {
  //       rolledSuccesses++;
  //     }
  //   });
  //   if (rolledSuccesses === 1) {
  //     displaySuccesses = `${rolledSuccesses} Success`;
  //   } else {
  //     displaySuccesses = `${rolledSuccesses} Successes`;
  //   }

  //   let passFail = ' - Fail!';
  //   roll.parts[0].options.rollOutcome = 'fail';
  //   if (ob === 0 && rolledSuccesses > ob) {
  //     passFail = ' - Pass!'
  //     roll.parts[0].options.rollOutcome = 'pass';
  //   } else if (ob > 0 && rolledSuccesses >= ob) {
  //     passFail = ' - Pass!'
  //     roll.parts[0].options.rollOutcome = 'pass';
  //   }
  //   renderTemplate('systems/torchbearer/templates/roll-template.html', {title: header, results: rollResult, dice: diceToRoll, success: displaySuccesses, flavorText: flavor, outcome: passFail}).then(t => {
  //     // Add the dice roll to the template
  //     templateData.roll = t,
  //     chatData.roll = JSON.stringify(roll);

  //     // Render the roll template
  //     renderTemplate(template, templateData).then(content => {
        
  //       // Update the message content
  //       chatData.content = content;

  //       // Hook into Dice So Nice!
  //       if (game.dice3d) {
  //         game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => {
  //           ChatMessage.create(chatData)
  //         });
  //       }
  //       // Roll normally, add a dice sound
  //       else {
  //         chatData.sound = CONFIG.sounds.dice;
  //         ChatMessage.create(chatData);
  //       }
  //     });
  //   });
  }

  async updateConflict(changes, source) {
    if(changes) {
      if(source !== 'resetConflict') {
        changes = Object.assign({}, await this.currentConflict(), changes);
      }
      await game.settings.set('conflict-sheet', 'currentConflict', changes);
    }
    this._hasUpdate = true;
    if(!this._updateSources) this._updateSources = [];
    this._updateSources.push(source);
    this.onUpdate();
    setTimeout(() => {
      if(this._hasUpdate) {
        this.sendMessage({type: "conflictChanged", source: this._updateSources});
        this._hasUpdate = false;
        this._updateSources = [];
      }
    }, 1000);
  }

  onUpdate() {
    this.render(false);
  }

  handleMessage(message) {
    switch(payload.type) {
      case "conflictChanged":
        console.log("Informed of conflict change");
        console.log(payload);
        this.onUpdate();
        break;
    }
  }

  sendMessage(message) {
    game.socket.emit('system.torchbearer', {
      messageType: "conflict",
      name: 'conflict',
      payload: message
    });
  }

}