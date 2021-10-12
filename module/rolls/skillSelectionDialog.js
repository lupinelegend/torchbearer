import { MasterSkillsList } from "../misc.js";

export class SkillSelectionDialog extends Dialog {
  static async create(tbActor, opts, onComplete) {
    let dialogContent = "systems/torchbearer/templates/skill-selection-dialog-content.html";
    let template = await renderTemplate(dialogContent, Object.assign({ allSkills: MasterSkillsList() }, opts));
    new SkillSelectionDialog(tbActor, { content: template }, onComplete, opts).render(true);
  }

  constructor(tbActor, dialogData, onComplete, opts) {
    dialogData = Object.assign(
      {
        title: "Skill Selection",
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: "Complete",
            callback: (html) => {
              let skillOrAbility = html.find("#skillOrAbility").val();
              if (skillOrAbility === "None") {
                skillOrAbility = "Nature";
              }
              onComplete(
                Object.assign({}, opts, {
                  skillOrAbility: skillOrAbility,
                })
              );
            },
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel`,
          },
        },
        default: "yes",
      },
      dialogData
    );
    super(dialogData);
    this.actor = tbActor;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
