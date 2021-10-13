import { MasterSkillsList } from "../misc.js";
import { ByName } from "./types.js";

export class DispoDialog extends Dialog {
  static async create(conflictCaptain, partyOrder, conflictType, onComplete) {
    let hungry = false;
    let exhausted = false;
    partyOrder.forEach((actorId) => {
      let tbActor = game.actors.get(actorId);
      if (tbActor.tbData().hungryandthirsty) {
        hungry = true;
      }
      if (tbActor.tbData().exhausted) {
        exhausted = true;
      }
    });

    let dialogContent = "systems/torchbearer/templates/disposition-roll-template.html.hbs";

    renderTemplate(dialogContent, {
      conflictType: ByName(conflictType),
      hungry,
      exhausted,
      allSkills: MasterSkillsList(),
    }).then((template) => {
      new DispoDialog(conflictType, { content: template }, onComplete).render(true);
    });
  }

  constructor(conflictType, dialogData, onComplete) {
    dialogData = Object.assign(
      {
        title: `Disposition`,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Roll`,
            callback: (html) => {
              console.log("Yes clicked");
              let skill = html.find("#skillRoll").val();
              let otherSkill = html.find("#otherSkill").val();
              let otherAbility = html.find("#otherAbility").val();
              let hungry = !!html.find("#anyHungry").prop("checked");
              let exhausted = !!html.find("#anyExhausted").prop("checked");
              if (conflictType === "Other") {
                onComplete(conflictType, otherSkill, otherAbility, hungry, exhausted);
              } else {
                onComplete(conflictType, skill, ByName(conflictType).ability, hungry, exhausted);
              }
            },
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: `Cancel`,
            callback: (/* html */) => {
              console.log("No clicked");
            },
          },
        },
        close: () => console.log("closed"),
        default: "yes",
      },
      dialogData
    );
    super(dialogData);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#conflictType").change((ev) => {
      let $target = $(ev.currentTarget);
      let type = CONFLICT_TYPES.find((t) => t.name === $target.val());
      let $skillRoll = html.find("#skillRoll");
      $skillRoll.find("option:gt(0)").remove();
      type.skill.forEach((skill) => {
        $skillRoll.append($("<option></option>").attr("value", skill).text(skill));
      });
      if (type.name === "Other") {
        html.find("#ifNotOther").addClass("hidden");
        html.find("#ifOther").removeClass("hidden");
      } else {
        html.find("#ifOther").addClass("hidden");
        html.find("#ifNotOther").removeClass("hidden");
      }
    });
    html.find("#otherSkill").change((ev) => {
      let $target = $(ev.currentTarget);
      let $otherAbility = html.find("#otherAbility");
      let skill = MasterSkillsList()[$target.val()];
      if (skill.bl === "W") {
        $otherAbility.val("Will");
      } else if (skill.bl === "H") {
        $otherAbility.val("Health");
      }
    });
  }
}
