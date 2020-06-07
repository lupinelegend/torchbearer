import { TorchbearerActor } from "./actor/actor.js";

export const fateForLuck = function(app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let ob = app.roll.parts[0].options.ob;
  console.log(`Ob passed in: ${ob}`);

  // Return if the actor doesn't have any fate points to spend
  if (actor.data.data.fate.value < 1) {
    ui.notifications.error("You don't have any fate points to spend");
    return;
  } else {
    actor.update({'data.fate.value': actor.data.data.fate.value - 1});
    actor.update({'data.fate.spent': actor.data.data.fate.spent + 1});
  }

  let diceRoll = app.roll;
  // Determine how many 6's were rolled
  let rerolls = 0;
  let originalSuccesses = 0;
  diceRoll.parts[0].rolls.forEach(key => {
    if (key.roll === 6) {
      rerolls++;
    }
    if (key.roll > 3) {
      originalSuccesses++;
    }
  });
  if (app.roll.parts[0].options.currentSuccesses != undefined) {
    originalSuccesses = app.roll.parts[0].options.currentSuccesses
  }
  console.log(`Original successes: ${originalSuccesses}`);

  // Return if there aren't any 6's to reroll
  if (rerolls === 0) {
    ui.notifications.error("There are no 6's to be rerolled");
    return;
  }
  let header = 'Lucky Reroll';
  let formula = `${rerolls}d6`;
  let explode = true;
  reRoll(header, formula, explode, actor, originalSuccesses, ob);
}

export const ofCourse = function(app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let ob = app.roll.parts[0].options.ob;

  // Return if the actor doesn't have any persona points to spend
  if (actor.data.data.persona.value < 1) {
    ui.notifications.error("You don't have any persona points to spend");
    return;
  } else {
    actor.update({'data.persona.value': actor.data.data.persona.value - 1});
    actor.update({'data.persona.spent': actor.data.data.persona.spent + 1});
  }

  let diceRoll = app.roll;
  // Determine how many scoundrels were rolled
  let scoundrels = 0;
  let originalSuccesses = 0;
  diceRoll.parts[0].rolls.forEach(key => {
    if (key.roll < 4) {
      scoundrels++;
    }
    if (key.roll > 3) {
      originalSuccesses++;
    }
  });

  // Return if there aren't any scoundrels to reroll
  if (scoundrels === 0) {
    ui.notifications.error("There are no scoundrels to be rerolled");
    return;
  }

  let header = 'Of Course!';
  let formula = `${scoundrels}d6`;
  let explode = false;
  reRoll(header, formula, explode, actor, originalSuccesses, ob);
}

export const deeperUnderstanding = function(app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);

  // Return if the actor doesn't have any fate points to spend
  if (actor.data.data.fate.value < 1) {
    ui.notifications.error("You don't have any fate points to spend");
    return;
  } else {
    actor.update({'data.fate.value': actor.data.data.fate.value - 1});
    actor.update({'data.fate.spent': actor.data.data.fate.spent + 1});
  }

  let diceRoll = app.roll;
  // Determine how many scoundrels were rolled
  let scoundrels = 0;
  diceRoll.parts[0].rolls.forEach(key => {
    if (key.roll < 4) {
      scoundrels++;
    }
  });

  // Return if there aren't any scoundrels to reroll
  if (scoundrels === 0) {
    ui.notifications.error("There are no scoundrels to be rerolled");
    return;
  }

  let header = 'Deeper Understanding';
  let formula = `1d6`;
  let explode = false;
  reRoll(header, formula, explode, actor);
}

function reRoll(header, formula, explode, actor, originalSuccesses, ob) {
  // Prep the roll template
  let template;
  if (header === 'Lucky Reroll' || header === 'Deeper Understanding') {
    template = 'systems/torchbearer/templates/lucky-reroll.html';
  } else if (header === 'Of Course!') {
    template = 'systems/torchbearer/templates/ofcourse-reroll.html';
  }
  else {
    template = 'systems/torchbearer/templates/torchbearer-roll.html';
  }

  // GM rolls
  let chatData = {
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({ actor: actor })
  };
  let templateData = {
    title: header,
    ob: ob,
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
  if (explode === true) {
    roll.parts[0].explode([6]);
  }

  //Create an array of the roll results
  let rollResult = [];
  let sixes = 0;
  roll.parts[0].rolls.forEach(key => {
    if (key.roll === 6) {
      sixes++;
      rollResult.push({
        result: key.roll,
        style: ' max'
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
  if (roll.parts[0].options.currentSuccesses === undefined) {
    totalSuccesses = originalSuccesses + rolledSuccesses;
  } else {
    totalSuccesses = roll.parts[0].options.currentSuccesses + rolledSuccesses;
  }

  // Reassign the ob
  roll.parts[0].options.ob = ob;
  roll.parts[0].options.currentSuccesses = totalSuccesses;
  console.log(`Post assignment: ${roll.parts[0].options.currentSuccesses}`);
  console.log(roll);

  if (totalSuccesses < ob) {
    if (totalSuccesses === 1) {
      displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Success - Fail!`;
    } else {
      displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Successes - Fail!`;
    }
  } else if (totalSuccesses >= ob) {
    if (totalSuccesses === 1) {
      displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Success - Pass!`;
    } else {
      displaySuccesses = `${originalSuccesses} + ${rolledSuccesses} = ${totalSuccesses} Successes - Pass!`;
    }
  }

  renderTemplate('systems/torchbearer/templates/roll-template.html', {title: header, results: rollResult, success: displaySuccesses}).then(t => {
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