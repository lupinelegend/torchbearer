import {SafeNum} from "../misc.js";

export class PlayerRollDialog extends Dialog {
    static async create(opts, onComplete) {
        let dialogContent = 'systems/torchbearer/templates/roll-dialog-content.html';
        let template = await renderTemplate(dialogContent,
            Object.assign({helpDice: 0, supplies: 0, persona: 0}, opts)
        );
        new PlayerRollDialog({content: template}, onComplete, opts).render(true);
    }

    constructor(dialogData, onComplete, opts) {
        dialogData = Object.assign({
            title: `Test`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Roll`,
                    callback: (html) => {
                        let flavorText = html.find('#flavorText').val();
                        let helpDice = SafeNum(html.find('#helpingDice').val());
                        let ob = SafeNum(html.find('#ob').val());
                        let trait = {
                            name: html.find('#traitDropdown').val(),
                            usedFor: !!html.find('#traitFor').prop('checked'),
                            usedAgainst: !!html.find('#traitAgainst').prop('checked'),
                            usedAgainstExtra: !!html.find('#traitAgainstExtra').prop('checked')
                        };
                        let tapNature = !!html.find('#natureYes').prop('checked');
                        let supplies = SafeNum(html.find('#supplies').val());
                        let persona = SafeNum(html.find('#personaAdvantage').val());
                        let natureDescriptor = html.find('#natureDesc').val();

                        let rollTypeIndependent = !!html.find('#rollTypeIndependent').prop('checked');
                        let rollTypeVersus = !!html.find('#rollTypeVersus').prop('checked');
                        let rollTypeDisposition = !!html.find('#rollTypeDisposition').prop('checked');
                        let rollType = rollTypeIndependent ? 'independent' : (
                            rollTypeVersus ? 'versus' : (
                                rollTypeDisposition ? 'disposition' : 'independent'
                            )
                        );
                        onComplete(Object.assign({}, opts, {
                            flavorText, helpDice, ob, trait, tapNature,
                            supplies, persona, natureDescriptor, rollType
                        }));
                    }
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`
                }
            },
            default: 'yes'
        }, dialogData);
        super(dialogData);
    }

    activateListeners(html) {
        super.activateListeners(html);
        let origDice = SafeNum(html.find('#rolling').data('orig'));
        if(origDice < 1) {
            html.find('button').each((i, el) => {
                let $el = $(el);
                if($el.data('button') === 'yes') {
                    $el.prop('disabled', true);
                }
            });
        }

        html.find('.dice-modifier').change(ev => {
            let sum = 0;
            html.find('.dice-modifier').each((i, el) => {
                if(el.type ==='radio') {
                    if(el.checked) {
                        sum += SafeNum($(el).val());
                    }
                } else {
                    sum += SafeNum($(el).val());
                }
            });
            let $rolling = html.find('#rolling');
            let newRolling = SafeNum($rolling.data('orig')) + sum;
            $rolling.text(`${newRolling}D`);
            html.find('button').each((i, el) => {
                let $el = $(el);
                if($el.data('button') === 'yes') {
                    if(newRolling < 1) {
                        $el.prop('disabled', true);
                    } else {
                        $el.prop('disabled', false);
                    }
                }
            });
        });
    }
}