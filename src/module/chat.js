export const fateForLuck = function (app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let ob = app.roll.terms[0].options.ob;
  let rollType = app.roll.terms[0].options.rollType;
  let advanceable = app.roll.terms[0].options.advanceable;
  let skillOrAbility = html.find(".tb-roll-data").data("skillOrAbility");

  // Return if the actor doesn't have any fate points to spend
  if (actor.data.data.fate.value < 1) {
    ui.notifications.error("You don't have any fate points to spend");
    return;
  } else {
    actor.update({ "data.fate.value": actor.data.data.fate.value - 1 });
    actor.update({ "data.fate.spent": actor.data.data.fate.spent + 1 });
  }

  let diceRoll = app.roll;
  // Determine how many 6's were rolled
  let rerolls = 0;
  let originalSuccesses = 0;
  diceRoll.terms[0].rolls.forEach((key) => {
    if (key.roll === 6) {
      rerolls++;
    }
    if (key.roll > 3) {
      originalSuccesses++;
    }
  });
  if (app.roll.terms[0].options.currentSuccesses !== undefined) {
    originalSuccesses = app.roll.terms[0].options.currentSuccesses;
  }

  // Return if there aren't any 6's to reroll
  if (rerolls === 0) {
    ui.notifications.error("There are no 6's to be rerolled");
    return;
  }
  let header = "Lucky Reroll";
  let formula = `${rerolls}d6`;
  let explode = true;
  reRoll(header, formula, explode, actor, originalSuccesses, ob, rollType, skillOrAbility, advanceable);
};

export const ofCourse = function (app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let ob = app.roll.terms[0].options.ob;
  let rollType = app.roll.terms[0].options.rollType;
  let advanceable = app.roll.terms[0].options.advanceable;
  let skillOrAbility = html.find(".tb-roll-data").data("skillOrAbility");

  // Return if the actor doesn't have any persona points to spend
  if (actor.data.data.persona.value < 1) {
    ui.notifications.error("You don't have any persona points to spend");
    return;
  } else {
    actor.update({ "data.persona.value": actor.data.data.persona.value - 1 });
    actor.update({ "data.persona.spent": actor.data.data.persona.spent + 1 });
  }

  let diceRoll = app.roll;
  // Determine how many scoundrels were rolled
  let scoundrels = 0;
  let originalSuccesses = 0;
  diceRoll.terms[0].rolls.forEach((key) => {
    if (key.roll < 4) {
      scoundrels++;
    }
    if (key.roll > 3) {
      originalSuccesses++;
    }
  });
  if (app.roll.terms[0].options.currentSuccesses !== undefined) {
    originalSuccesses = app.roll.terms[0].options.currentSuccesses;
  }

  // Return if there aren't any scoundrels to reroll
  if (scoundrels === 0) {
    ui.notifications.error("There are no scoundrels to be rerolled");
    return;
  }

  let header = "Of Course!";
  let formula = `${scoundrels}d6`;
  let explode = false;
  reRoll(header, formula, explode, actor, originalSuccesses, ob, rollType, skillOrAbility, advanceable);
};

export const deeperUnderstanding = function (app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let ob = app.roll.terms[0].options.ob;
  let rollType = app.roll.terms[0].options.rollType;
  let advanceable = app.roll.terms[0].options.advanceable;
  let skillOrAbility = html.find(".tb-roll-data").data("skillOrAbility");

  // Return if the actor doesn't have any fate points to spend
  if (actor.data.data.fate.value < 1) {
    ui.notifications.error("You don't have any fate points to spend");
    return;
  } else {
    actor.update({ "data.fate.value": actor.data.data.fate.value - 1 });
    actor.update({ "data.fate.spent": actor.data.data.fate.spent + 1 });
  }

  let diceRoll = app.roll;
  // Determine how many scoundrels were rolled
  let scoundrels = 0;
  let originalSuccesses = 0;
  diceRoll.terms[0].rolls.forEach((key) => {
    if (key.roll < 4) {
      scoundrels++;
    }
    if (key.roll > 3) {
      originalSuccesses++;
    }
  });
  if (app.roll.terms[0].options.currentSuccesses !== undefined) {
    originalSuccesses = app.roll.terms[0].options.currentSuccesses;
  }

  // Return if there aren't any scoundrels to reroll
  if (scoundrels === 0) {
    ui.notifications.error("There are no scoundrels to be rerolled");
    return;
  }

  let header = "Deeper Understanding";
  let formula = `1d6`;
  let explode = false;
  reRoll(header, formula, explode, actor, originalSuccesses, ob, rollType, skillOrAbility, advanceable);
};

export const logTest = async function (app, html, skillOrAbility, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let test = skillOrAbility;
  console.log(skillOrAbility);

  if (app.roll.terms[0].options.rollType === "versus") {
    ui.notifications.error("You must log the Pass/Fail of Versus tests manually.");
    return;
  }
  if (app.roll.terms[0].options.rollType === "disposition") {
    ui.notifications.error("Disposition tests are not logged for advancement.");
    return;
  }
  if (app.roll.terms[0].options.ob === 0) {
    ui.notifications.error("Ob 0 tests are not logged for advancement.");
    return;
  }

  if (Object.prototype.hasOwnProperty.call(actor.tbData().skills, test)) {
    if (app.roll.terms[0].options.rollOutcome === "pass") {
      actor.update({ [`data.skills.${test}.pass`]: parseInt(actor.data.data.skills[test].pass + 1) });
    } else if (app.roll.terms[0].options.rollOutcome === "fail") {
      actor.update({ [`data.skills.${test}.fail`]: parseInt(actor.data.data.skills[test].fail + 1) });
    }
  } else {
    if (app.roll.terms[0].options.rollOutcome === "pass") {
      actor.update({ [`data.${test}.pass`]: parseInt(actor.data.data[test].pass + 1) });
    } else if (app.roll.terms[0].options.rollOutcome === "fail") {
      actor.update({ [`data.${test}.fail`]: parseInt(actor.data.data[test].fail + 1) });
    }
  }
};

function reRoll(header, formula, explode, actor, originalSuccesses, ob, rollType, skillOrAbility, advanceable) {
  // Prep the roll template
  let template;
  if (header === "Lucky Reroll") {
    template = "systems/torchbearer/templates/lucky-reroll.html.hbs";
  } else if (header === "Of Course!") {
    template = "systems/torchbearer/templates/ofcourse-reroll.html.hbs";
  } else if (header === "Deeper Understanding") {
    template = "systems/torchbearer/templates/deeperunderstanding-reroll.html.hbs";
  } else {
    template = "systems/torchbearer/templates/torchbearer-roll.html.hbs";
  }

  // GM rolls
  let chatData = {
    user: game.user.data._id,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
  };
  let templateData = {
    title: header,
    ob: ob,
    roll: {},
    skillOrAbility: skillOrAbility,
    advanceable: advanceable,
  };

  // Handle roll visibility. Blind doesn't work; you'll need a render hook to hide it.
  let rollMode = game.settings.get("core", "rollMode");
  if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
  if (rollMode === "selfroll") chatData["whisper"] = [game.user.data._id];
  if (rollMode === "blindroll") chatData["blind"] = true;

  // Do the roll
  let roll = new Roll(formula);
  roll.roll();
  if (explode === true) {
    roll.terms[0].explode([6]);
  }

  //Create an array of the roll results
  let rollResult = [];
  let sixes = 0;
  roll.terms[0].rolls.forEach((key) => {
    if (key.roll === 6) {
      sixes++;
      rollResult.push({
        result: key.roll,
        style: " max",
      });
    } else {
      rollResult.push({
        result: key.roll,
      });
    }
  });
  templateData.rerollsAvailable = sixes;

  // Count successes
  let rolledSuccesses = 0;
  let displaySuccesses;
  rollResult.forEach((index) => {
    if (index.result > 3) {
      rolledSuccesses++;
    }
  });

  let totalSuccesses;
  if (roll.terms[0].options.currentSuccesses === undefined) {
    totalSuccesses = originalSuccesses + rolledSuccesses;
  } else {
    totalSuccesses = roll.terms[0].options.currentSuccesses + rolledSuccesses;
  }

  // Reassign the ob
  roll.terms[0].options.ob = ob;
  roll.terms[0].options.rollType = rollType;
  roll.terms[0].options.currentSuccesses = totalSuccesses;
  roll.terms[0].options.advanceable = advanceable;

  if (rollType === "independent") {
    if (totalSuccesses < ob) {
      if (totalSuccesses === 1) {
        displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Success - Fail!`;
        roll.terms[0].options.rollOutcome = "fail";
      } else {
        displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Successes - Fail!`;
        roll.terms[0].options.rollOutcome = "fail";
      }
    } else if (totalSuccesses >= ob) {
      if (totalSuccesses === 1) {
        displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Success - Pass!`;
        roll.terms[0].options.rollOutcome = "pass";
      } else {
        displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Successes - Pass!`;
        roll.terms[0].options.rollOutcome = "pass";
      }
    }
  } else if (rollType === "versus") {
    roll.terms[0].options.rollOutcome = "versus";
    if (totalSuccesses === 1) {
      displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Successes`;
    } else {
      displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Successes`;
    }
  } else if (rollType === "disposition") {
    roll.terms[0].options.rollOutcome = "disposition";
    displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Total Disposition`;
  }

  renderTemplate("systems/torchbearer/templates/roll-template.html.hbs", {
    title: header,
    results: rollResult,
    success: displaySuccesses,
  }).then((t) => {
    // Add the dice roll to the template
    (templateData.roll = t), (chatData.roll = JSON.stringify(roll));

    // Render the roll template
    renderTemplate(template, templateData).then((content) => {
      // Update the message content
      chatData.content = content;

      // Hook into Dice So Nice!
      if (game.dice3d) {
        game.dice3d.showForRoll(roll, chatData.whisper, chatData.blind).then(() => {
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
