import { Capitalize } from "../misc.js";
import { CharacterAdjustment } from "../actor/character-adjustment.js";
import { PlayerRollDialog } from "./playerRollDialog.js";

export class PlayerRoll {
  constructor(tbCharacter) {
    this.actor = tbCharacter;
  }

  async roll(opts) {
    let {
      skillOrAbility,
      header,
      flavorText,
      helpDice,
      ob,
      trait,
      tapNature,
      supplies,
      persona, // natureDescriptor,
      rollType,
      modifiers,
      miscDice,
      miscMinusSuccesses,
      miscPlusSuccesses,
      inadequateTools,
    } = opts;

    // Check for any factors due to conditions
    let modifiedStats = this.modifiedStats();
    let characterAdjustment = new CharacterAdjustment(this.actor);

    // Determine if and how a Trait is being used
    let traitMod = 0;
    if (trait.name) {
      let ok = false;
      if (trait.usedFor) {
        ok = characterAdjustment.useTraitPositively(trait.name);
        traitMod = 1;
      } else if (trait.usedAgainst) {
        ok = characterAdjustment.addChecks(trait.name, 1);
        traitMod = -1;
      } else if (trait.usedAgainstExtra) {
        ok = characterAdjustment.addChecks(trait.name, 2);
        traitMod = -2;
      }
      if (!ok) {
        return;
      }
    }

    // Check to see if persona points are spent to add +XD
    let personaMod = 0;
    if (persona > 0) {
      if (characterAdjustment.spendPersona(persona)) {
        personaMod = persona;
      } else {
        return;
      }
    }

    // Determine if Nature has been tapped. If so, add Nature to roll and deduce 1 persona point.
    let natureMod = 0;
    if (tapNature) {
      if (characterAdjustment.spendPersona(1)) {
        natureMod = this.actor.data.data.nature.value;
      } else {
        return;
      }
    }

    if (inadequateTools) {
      miscMinusSuccesses += 1;
    }

    const skillList = this.actor.data.data.skills;

    // Determine number of dice to roll.
    let diceToRoll;
    let beginnersLuck = "";

    if (skillList[skillOrAbility]) {
      let skill = skillList[skillOrAbility];
      if (skill.rating > 0) {
        diceToRoll =
          skill.rating +
          traitMod +
          natureMod +
          modifiers.dice.total +
          supplies +
          helpDice +
          personaMod +
          modifiedStats.skillMod +
          miscDice;
      } else {
        //Beginner's Luck
        if (this.actor.data.data.afraid) {
          ui.notifications.error("You can't use Beginner's Luck when you're afraid");
          return false;
        } else {
          let blAbility = skill.bl;
          let name = "";
          if (blAbility === "W") {
            name = "will";
          } else {
            name = "health";
          }
          if (this.actor.data.data[name].value > 0) {
            beginnersLuck = `(Beginner's Luck, ${Capitalize(name)})`;
            diceToRoll =
              Math.ceil((modifiedStats[name] + supplies + helpDice) / 2) +
              traitMod +
              natureMod +
              modifiers.dice.total +
              personaMod +
              miscDice;
          } else {
            // If 0, use Nature instead
            beginnersLuck = "(Beginner's Luck, Nature)";
            diceToRoll =
              Math.ceil((modifiedStats.nature + supplies + helpDice) / 2) +
              traitMod +
              natureMod +
              modifiers.dice.total +
              personaMod +
              miscDice;
          }
        }
      }
    }

    // Otherwise it's an ability
    if (!diceToRoll && diceToRoll !== 0) {
      diceToRoll =
        modifiedStats[skillOrAbility.toLowerCase()] +
        traitMod +
        natureMod +
        modifiers.dice.total +
        supplies +
        helpDice +
        personaMod +
        miscDice;
    }

    // GM rolls
    let chatData = {
      user: game.user.data._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    };

    // Handle roll visibility. Blind doesn't work; you'll need a render hook to hide it.
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.data._id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Do the roll
    let rolledSuccesses = 0;
    let advanceable = rollType === "independent" && ob > 0;
    let formula = `${diceToRoll}d6`;
    let roll = new Roll(formula);
    let rollResult = [];
    let templateData = {
      title: header,
      skillOrAbility: skillOrAbility,
      flavorText: flavorText,
      bL: beginnersLuck,
      advanceable: advanceable,
      roll: {},
    };
    if (diceToRoll > 0) {
      // Build the formula
      await characterAdjustment.execute();
      await roll.roll({ async: true });
      roll.terms[0].options.ob = ob;
      roll.terms[0].options.rollType = rollType;
      roll.terms[0].options.advanceable = advanceable;
      // Changed roll.parts to roll.terms due to deprecation

      //Create an array of the roll results
      let sixes = 0;
      let scoundrels = 0;
      helpDice += supplies;
      console.log(roll);
      roll.terms[0].results.forEach((key, index) => {
        //console.log(key.result);
        let tempObj = { result: key.result, style: "" };
        if (key.roll === 6) {
          tempObj.style = " max";
          sixes++;
        }
        if (key.roll < 4) {
          scoundrels++;
        }
        if (helpDice !== 0 && index >= diceToRoll - helpDice - natureMod - personaMod) {
          let temp = tempObj.style;
          temp += " help";
          tempObj.style = temp;
        }
        if (natureMod !== 0 && index >= diceToRoll - natureMod - personaMod) {
          let temp = tempObj.style;
          temp += " nature";
          tempObj.style = temp;
        }
        if (personaMod !== 0 && index >= diceToRoll - personaMod) {
          let temp = tempObj.style;
          temp += " persona";
          tempObj.style = temp;
        }
        rollResult.push(tempObj);
      });
      console.log(rollResult);

      // Only loads these values if Fate and Persona are available to spend. Without these values
      // being set, the buttons won't show up under the roll.
      if (this.actor.data.data.fate.value !== 0) {
        templateData.rerollsAvailable = sixes;
      }
      if (this.actor.data.data.persona.value !== 0) {
        templateData.scoundrelsAvailable = scoundrels;
      }

      // Count successes
      rollResult.forEach((index) => {
        if (index.result > 3) {
          rolledSuccesses++;
        }
      });
    }

    let minusSuccesses = modifiers.minusSuccesses.total + miscMinusSuccesses;
    let plusSuccesses = 0; //these are only counted if the roll would pass
    let totalSuccesses = rolledSuccesses;
    //Convert Factors to -s in Versus/Dispo tests
    if (rollType === "independent") {
      ob += modifiers.factors.total;
    } else {
      minusSuccesses += modifiers.factors.total;
    }

    totalSuccesses += modifiers.base.total;
    totalSuccesses -= minusSuccesses;
    if (totalSuccesses < 0) totalSuccesses = 0;

    let passFail = "";
    let displaySuccesses = "";
    if (diceToRoll > 0) {
      roll.terms[0].options.currentSuccesses = totalSuccesses;
      if (rollType === "independent") {
        passFail = " - Fail!";
        roll.terms[0].options.rollOutcome = "fail";
        if (totalSuccesses >= ob && totalSuccesses > 0) {
          plusSuccesses = modifiers.plusSuccesses.total + miscPlusSuccesses;
          totalSuccesses += plusSuccesses;
          passFail = " - Pass!";
          roll.terms[0].options.rollOutcome = "pass";
        }
        if (totalSuccesses === 1) {
          displaySuccesses = `${totalSuccesses} Success`;
        } else {
          displaySuccesses = `${totalSuccesses} Successes`;
        }
      } else if (rollType === "versus") {
        roll.terms[0].options.rollOutcome = "versus";
        plusSuccesses = modifiers.plusSuccesses.total + miscPlusSuccesses;
        if (totalSuccesses === 1) {
          displaySuccesses = `${totalSuccesses} Success`;
        } else {
          displaySuccesses = `${totalSuccesses} Successes`;
        }
        if (modifiers.plusSuccesses.total + miscPlusSuccesses > 0) {
          displaySuccesses += ` (+${plusSuccesses}s?)`;
        }
      } else if (rollType === "disposition") {
        plusSuccesses = modifiers.plusSuccesses.total + miscPlusSuccesses;
        totalSuccesses += plusSuccesses;
        roll.terms[0].options.rollOutcome = "disposition";
        displaySuccesses = `${totalSuccesses} Total Disposition`;
      }
    } else {
      passFail = "No Test";
    }

    renderTemplate("systems/torchbearer/templates/roll-template.html.hbs", {
      title: header,
      results: rollResult,
      dice: diceToRoll,
      success: displaySuccesses,
      flavorText: flavorText,
      minusSuccesses: minusSuccesses,
      plusSuccesses: plusSuccesses,
      outcome: passFail,
    }).then((t) => {
      // Add the dice roll to the template
      templateData.roll = t;
      templateData.rollDetails =
        rollType === "versus"
          ? `${diceToRoll}D versus test`
          : rollType === "disposition"
          ? `${diceToRoll}D disposition test`
          : `${diceToRoll}D vs. Ob ${ob}`;
      chatData.roll = diceToRoll < 1 ? "{}" : JSON.stringify(roll);

      // Render the roll template
      renderTemplate("systems/torchbearer/templates/torchbearer-roll.html.hbs", templateData).then((content) => {
        // Update the message content
        chatData.content = content;

        // Hook into Dice So Nice!
        if (game.dice3d) {
          game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(() => {
            ChatMessage.create(chatData);
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

  modifiedStats() {
    let tbData = this.actor.tbData();
    let modifier = 0;
    return {
      will: tbData.will.value - modifier,
      health: tbData.health.value - modifier,
      nature: tbData.nature.value - modifier,
      skillMod: modifier,
    };
  }

  organizeModifiers(modifiers) {
    const organized = {
      base: { total: 0, label: "", components: [] },
      dice: { total: 0, label: "", components: [] },
      minusSuccesses: { total: 0, label: "", components: [] },
      plusSuccesses: { total: 0, label: "", components: [] },
      factors: { total: 0, label: "", components: [] },
    };

    for (let i = 0; i < modifiers.length; i++) {
      let modifier = duplicate(modifiers[i]);
      let effect = String(modifier.effect);
      modifier.amount = parseInt(effect);
      if (effect.toLowerCase() === "factor") {
        modifier.amount = 1;
        organized.factors.components.push(modifier);
      } else if (effect.toLowerCase().includes("d")) {
        organized.dice.components.push(modifier);
      } else if (effect.toLowerCase().includes("s")) {
        if (modifier.amount < 0) {
          modifier.amount *= -1;
          organized.minusSuccesses.components.push(modifier);
        } else if (modifier.amount > 0) {
          organized.plusSuccesses.components.push(modifier);
        }
      } else {
        organized.base.components.push(modifier);
      }
    }
    for (let key in organized) {
      if (Object.prototype.hasOwnProperty.call(organized, key)) {
        let section = organized[key];
        for (let i = 0; i < section.components.length; i++) {
          let modifier = section.components[i];
          section.total += modifier.amount;
          if (key !== "factors") {
            section.label += `${modifier.label} (${modifier.effect})`;
          } else {
            section.label += `${modifier.label}`;
          }
          if (i < section.components.length - 1) {
            section.label += ", ";
          }
        }
      }
    }
    console.log(organized);
    return organized;
  }

  async showDialog(skillOrAbility, opts = {}, modifierList = []) {
    modifierList = [].concat(modifierList);
    if (this.actor.tbData().fresh) {
      modifierList.push({
        name: "fresh",
        label: "Fresh",
        effect: "+1D",
      });
    }
    if (this.actor.tbData().injured) {
      modifierList.push({
        name: "injured",
        label: "Injured",
        effect: "-1D",
      });
    }
    if (this.actor.tbData().sick) {
      modifierList.push({
        name: "sick",
        label: "Sick",
        effect: "-1D",
      });
    }
    await this.applyTestSpecificPersonalFactors(skillOrAbility, modifierList);
    let modifiers = this.organizeModifiers(modifierList);

    // Build an actor trait list to be passed to the dialog box
    let traits = this.actor.getTraitNames();

    // Build a Nature descriptor list to be passed to the dialog box
    let natureDesc = this.actor.getNatureDescriptors();
    natureDesc.push("Acting outside character's nature");

    let header = `Testing: ${Capitalize(skillOrAbility)} (${this.actor.getRating(skillOrAbility)})`;
    let rolling = this.actor.getRating(skillOrAbility) + modifiers.dice.total;
    let natureRating = this.actor.getRating("Nature");
    let rollType = "independent";
    let ob = 1;
    PlayerRollDialog.create(
      this.actor,
      Object.assign(
        {
          skillOrAbility,
          header,
          rolling,
          traits,
          modifiers,
          natureRating,
          natureDesc,
          rollType,
          ob,
        },
        opts
      ),
      this.roll.bind(this)
    );
  }

  async applyTestSpecificPersonalFactors(skillOrAbility, modifierList) {
    let lightLevel = await this.actor.getLightLevel();
    if (lightLevel === 0) {
      if (skillOrAbility === "Cartographer" || skillOrAbility === "Scholar") {
        ui.notifications.error("Cannot perform a Cartographer or Scholar test in Darkness");
        throw "Cannot perform a Cartographer or Scholar test in Darkness";
      }
      modifierList.push({
        name: "darkness",
        label: "Darkness",
        effect: "Factor",
      });
    }
    if (lightLevel === 1) {
      modifierList.push({
        name: "dimlight",
        label: "Dim Light",
        effect: "Factor",
      });
    }
    if (skillOrAbility === "Dungeoneer" || skillOrAbility === "Fighter") {
      let torsoSlots = this.actor.tbData().computed.inventory["Torso"].slots;
      for (let i = 0; i < torsoSlots.length; i++) {
        if (torsoSlots[i].name === "Backpack") {
          modifierList.push({
            name: "backpack",
            label: "Backpack",
            effect: "Factor",
          });
        }
      }
    }
  }
}
