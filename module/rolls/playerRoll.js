export class PlayerRoll {
    constructor(tbCharacter) {
        this.actor = tbCharacter;
    }

    async roll(skillOrAbility, header, flavorText, helpDice, ob, trait, nature, natureDoubleTap, freshCheck, supplies, persona, natureDescriptor) {

        // Check for any factors due to conditions
        let adjustedStats = this.conditionMods();

        // Exhausted is a factor in all tests except Circles and Resources
        if (this.actor.data.data.exhausted === true) {
            if (skillOrAbility !== 'circles' && skillOrAbility !== 'resources') {
                ob = parseInt(ob) + 1;
            }
        }

        // Check to see if the Fresh bonus should be applied
        let freshMod = 0;
        if (freshCheck === "checked") {
            freshMod = 1;
        }

        // Determine if and how a Trait is being used
        let traitMod = 0;
        let abort = false;
        if (trait.name !== "") {
            if (trait.usedFor === true) {
                let ok = await this.actor.useTraitPositively(trait.name);
                if(ok) {
                    traitMod = 1;
                } else {
                    abort = true;
                }
            } else if (trait.usedAgainst === true) {
                let ok = await this.actor.addChecks(trait, 1);
                if(ok) {
                    traitMod = -1;
                } else {
                    abort = true;
                }
            } else if (trait.usedAgainstExtra === true) {
                let ok = await this.actor.addChecks(trait, 2);
                if(ok) {
                    traitMod = -2;
                } else {
                    abort = true;
                }
            }
        }

        // Stop the roll if the user is trying to use a trait that's already been used this session
        if (abort === true) {
            return;
        }

        // Check to see if persona points are spent to add +XD
        let personaMod = 0;
        if(persona > 0) {
            if(await this.actor.spendPersona(persona)) {
                personaMod = persona;
            } else {
                ui.notifications.error("ERROR: You don't have enough persona to spend.");
                return;
            }
        }

        // Determine if Nature has been tapped. If so, add Nature to roll and deduce 1 persona point.
        let natureMod = 0;
        if(nature || natureDoubleTap) {
            if(await this.actor.spendPersona(1)) {
                natureMod = this.actor.data.data.nature.value;
            } else {
                ui.notifications.error("ERROR: You don't have any persona to spend.");
            }
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
            if (skillOrAbility === key) {
                this.actor.data.data.isLastTestSkill = true;
                if (natureDoubleTap === false) {
                    // Check for Beginner's Luck
                    if (this.actor.data.data.skills[skillOrAbility].rating === 0 && this.actor.data.data.afraid === true) {
                        ui.notifications.error("You can't use Beginner's Luck when you're afraid");
                        abort = true;
                    } else if (this.actor.data.data.skills[skillOrAbility].rating === 0 && this.actor.data.data.afraid === false) {
                        let blAbility = this.actor.data.data.skills[skillOrAbility].bl;
                        if (blAbility === "W") {
                            // If Will is not zero, roll Beginner's Luck as normal
                            if (this.actor.data.data.will.value != 0) {
                                beginnersLuck = "(Beginner's Luck, Will)";
                                diceToRoll = Math.ceil((adjustedStats.will + supplies + helpDice)/2) + traitMod + natureMod + freshMod + personaMod;
                            } else if (this.actor.data.data.will.value === 0) {
                                // If Will is zero, use Nature instead
                                beginnersLuck = "(Beginner's Luck, Nature)";
                                diceToRoll = Math.ceil((adjustedStats.nature + supplies + helpDice)/2) + traitMod + natureMod + freshMod + personaMod;
                            }
                        } else if (blAbility === "H") {
                            // If Health is not zero, roll Beginner's Luck as normal
                            if (this.actor.data.data.health.value != 0) {
                                beginnersLuck = "(Beginner's Luck, Health)";
                                diceToRoll = Math.ceil((adjustedStats.health + supplies + helpDice)/2) + traitMod + natureMod + freshMod + personaMod;
                            } else if (this.actor.data.data.will.value === 0) {
                                // If Health is zero, use Nature instead
                                beginnersLuck = "(Beginner's Luck, Nature)";
                                diceToRoll = Math.ceil((adjustedStats.nature + supplies + helpDice)/2) + traitMod + natureMod + freshMod + personaMod;
                            }
                        }
                    } else {
                        diceToRoll = this.actor.data.data.skills[skillOrAbility].rating + traitMod + natureMod + freshMod + supplies + helpDice + personaMod + adjustedStats.skillMod;
                    }
                } else if (natureDoubleTap === true) {
                    diceToRoll = adjustedStats.nature + supplies + helpDice + traitMod + natureMod + freshMod + personaMod;
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
                diceToRoll = adjustedStats[skillOrAbility] + traitMod + natureMod + freshMod + supplies + helpDice + personaMod;
            } else if (natureDoubleTap === true) {
                diceToRoll = adjustedStats.nature + supplies + helpDice + traitMod + natureMod + freshMod + personaMod;
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
            if (helpDice != 0 && index >= (diceToRoll-helpDice-natureMod-personaMod)) {
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
        renderTemplate('systems/torchbearer/templates/roll-template.html', {title: header, results: rollResult, dice: diceToRoll, success: displaySuccesses, flavorText: flavorText, outcome: passFail}).then(t => {
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