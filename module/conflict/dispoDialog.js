import {MasterSkillsList} from "../misc.js";

const CONFLICT_TYPES = [
    {
        name: 'Banish/Abjure',
        skill: ['Arcanist', 'Ritualist', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Capture',
        skill: ['Fighter', 'Hunter', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Convince',
        skill: ['Persuader', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Convince Crowd',
        skill: ['Orator', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Drive Off',
        skill: ['Fighter', 'Nature'],
        ability: 'Health'
    },
    {
        name: 'Kill',
        skill: ['Fighter', 'Nature'],
        ability: 'Health'
    },
    {
        name: 'Pursue/Flee',
        skill: ['Scout', 'Rider', 'Nature'],
        ability: 'Health'
    },
    {
        name: 'Trick/Riddle',
        skill: ['Manipulator', 'Nature'],
        ability: 'Will'
    },
    {
        name: 'Other'
    }
];

export class DispoDialog extends Dialog {
    static async create(conflictCaptain, partyOrder, onComplete) {
        let hungry = false;
        let exhausted = false;
        partyOrder.forEach(actorId => {
            let tbActor = game.actors.get(actorId);
            if(tbActor.tbData().hungryandthirsty) {
                hungry = true;
            }
            //TODO should really by an id comparison...probably should store conflictCaptain as Id
            if(tbActor.name === conflictCaptain && tbActor.tbData().exhausted) {
                exhausted = true;
            }
        });

        let dialogContent = 'systems/torchbearer/templates/disposition-roll-template.html';

        renderTemplate(dialogContent, {conflictTypes: CONFLICT_TYPES, hungry: hungry, exhausted: exhausted, allSkills: MasterSkillsList()}).then(template => {
            new DispoDialog({content: template}, onComplete).render(true);
        });
    }

    constructor(dialogData, onComplete) {
        dialogData = Object.assign({
            title: `Disposition`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Roll`,
                    callback: (html) => {
                        console.log("Yes clicked");
                        let type = html.find('#conflictType').val();
                        let skill = html.find('#skillRoll').val();
                        let help = parseInt(html.find('#help').val());
                        let otherSkill = html.find('#skill').val();
                        let otherAbility = html.find('#ability').val();

                        if(type === 'Other') {
                            onComplete(type, otherSkill, otherAbility, help);
                        } else {
                            onComplete(type, skill, CONFLICT_TYPES.find(t => t.name === type).ability, help)
                        }
                    }
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`,
                    callback: (html) => {
                        console.log("No clicked");
                    }
                }
            },
            close: () => console.log('closed'),
            default: 'yes'
        }, dialogData);
        super(dialogData);
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find("#conflictType").change((ev) => {
            let $target = $(ev.target);
            console.log($target.val());
            let type = CONFLICT_TYPES.find(t => t.name === $target.val());
            let $skillRoll = html.find('#skillRoll');
            $skillRoll.find('option:gt(0)').remove();
            type.skill.forEach(skill => {
                $skillRoll.append($("<option></option>")
                    .attr("value", skill).text(skill));
            })
        });
    }
}