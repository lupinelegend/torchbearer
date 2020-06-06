import { TorchbearerActor } from "./actor/actor.js";

export const fateForLuck = function(app, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);
  let diceRoll = app.roll;
  // Determine how many 6's were rolled
  let rerolls = 0;
  diceRoll.parts[0].rolls.forEach(key => {
    if (key.roll === 6) {
      rerolls++;
    }
  });
  let formula = `${rerolls}d6`
  reRoll(formula, actor);
}

function reRoll(formula, actor) {
  // Prep the roll template
  let template = 'systems/torchbearer/templates/torchbearer-roll.html';

  // GM rolls
  let chatData = {
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({ actor: actor })
  };
  let templateData = {
    title: 'Reroll',
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
  roll.parts[0].explode([6]);

  //Create an array of the roll results
  let rollResult = [];
  roll.parts[0].rolls.forEach(key => {
    if (key.roll === 6) {
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

  // Count successes
  let rolledSuccesses = 0;
  let displaySuccesses;
  rollResult.forEach((index) => {
    if (index.result > 3) {
      rolledSuccesses++;
    }
  });
  if (rolledSuccesses === 1) {
    displaySuccesses = `${rolledSuccesses} Additional Success`;
  } else {
    displaySuccesses = `${rolledSuccesses} Additional Successes`;
  }

  renderTemplate('systems/torchbearer/templates/roll-template.html', {title: 'Reroll', results: rollResult, success: displaySuccesses}).then(t => {
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