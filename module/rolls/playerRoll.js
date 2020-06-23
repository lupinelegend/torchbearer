import {Capitalize} from "../misc.js";

export class PlayerRoll {
    constructor(tbCharacter) {
        this.actor = tbCharacter;
    }

    async roll(skillOrAbility, header, flavorText, helpDice, ob, trait, tapNature, fresh, supplies, persona, natureDescriptor) {

        // Check for any factors due to conditions
        let adjustedStats = this.conditionMods();

        // Exhausted is a factor in all tests except Circles and Resources
        if (this.actor.data.data.exhausted === true) {
            if (skillOrAbility !== 'circles' && skillOrAbility !== 'resources') {
                ob += 1;
            }
        }

        // Check to see if the Fresh bonus should be applied
        let freshMod = fresh ? 1 : 0;

        // Determine if and how a Trait is being used
        let traitMod = 0;
        if (trait.name) {
            let ok = false;
            if (trait.usedFor) {
                ok = await this.actor.useTraitPositively(trait.name);
                traitMod = 1;
            } else if (trait.usedAgainst) {
                ok = await this.actor.addChecks(trait, 1);
                traitMod = -1;
            } else if (trait.usedAgainstExtra) {
                ok = await this.actor.addChecks(trait, 2);
                traitMod = -2;
            }
            if (!ok) {
                return;
            }
        }

        // Check to see if persona points are spent to add +XD
        let personaMod = 0;
        if (persona > 0) {
            if (await this.actor.spendPersona(persona)) {
                personaMod = persona;
            } else {
                return;
            }
        }

        // Determine if Nature has been tapped. If so, add Nature to roll and deduce 1 persona point.
        let natureMod = 0;
        if (tapNature) {
            if (await this.actor.spendPersona(1)) {
                natureMod = this.actor.data.data.nature.value;
            } else {
                return;
            }
        }

        // Create an array of skills for the if check below
        const skillList = this.actor.data.data.skills;

        // Determine number of dice to roll.
        let diceToRoll;
        let beginnersLuck = "";

        if (skillList[skillOrAbility]) {
            let skill = skillList[skillOrAbility];
            this.actor.data.data.isLastTestSkill = true;
            if (skill.rating > 0) {
                diceToRoll = skill.rating + traitMod + natureMod + freshMod + supplies + helpDice + personaMod + adjustedStats.skillMod;
            } else {
                //Beginner's Luck
                if (this.actor.data.data.afraid) {
                    ui.notifications.error("You can't use Beginner's Luck when you're afraid");
                    return false;
                } else {
                    let blAbility = skill.bl;
                    let name = '';
                    if(blAbility === 'W') {
                        name = 'will';
                    } else {
                        name = 'health';
                    }
                    if (this.actor.data.data[name].value > 0) {
                        beginnersLuck = `(Beginner's Luck, ${Capitalize(name)})`;
                        diceToRoll = Math.ceil((adjustedStats[name] + supplies + helpDice) / 2) + traitMod + natureMod + freshMod + personaMod;
                    } else {
                        // If 0, use Nature instead
                        beginnersLuck = "(Beginner's Luck, Nature)";
                        diceToRoll = Math.ceil((adjustedStats.nature + supplies + helpDice) / 2) + traitMod + natureMod + freshMod + personaMod;
                    }
                }
            }
        }

        // Otherwise it's an ability
        if (!diceToRoll) {
            this.actor.data.data.isLastTestSkill = false;
            diceToRoll = adjustedStats[skillOrAbility] + traitMod + natureMod + freshMod + supplies + helpDice + personaMod;
        }

        // Build the formula
        let formula = `${diceToRoll}d6`;

        // Prep the roll template
        let template = 'systems/torchbearer/templates/torchbearer-roll.html';

        // GM rolls
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker({actor: this.actor})
        };
        let templateData = {
            title: header,
            flavorText: flavorText,
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
        helpDice += supplies;
        roll.parts[0].rolls.forEach((key, index) => {
            let tempObj = {result: key.roll, style: ''};
            if (key.roll === 6) {
                tempObj.style = ' max'
                sixes++;
            }
            if (key.roll < 4) {
                scoundrels++;
            }
            if (helpDice != 0 && index >= (diceToRoll - helpDice - natureMod - personaMod)) {
                let temp = tempObj.style
                temp += ' help';
                tempObj.style = temp;
            }
            if (natureMod != 0 && index >= (diceToRoll - natureMod - personaMod)) {
                let temp = tempObj.style
                temp += ' nature';
                tempObj.style = temp;
            }
            if (personaMod != 0 && index >= (diceToRoll - personaMod)) {
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
        renderTemplate('systems/torchbearer/templates/roll-template.html', {
            title: header,
            results: rollResult,
            dice: diceToRoll,
            success: displaySuccesses,
            flavorText: flavorText,
            outcome: passFail
        }).then(t => {
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
        return {
            'will': this.actor.data.data.will.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
            'health': this.actor.data.data.health.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
            'nature': this.actor.data.data.nature.value - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0),
            'skillMod': 0 - (this.actor.data.data.injured ? 1 : 0) - (this.actor.data.data.sick ? 1 : 0)
        };
    }

}