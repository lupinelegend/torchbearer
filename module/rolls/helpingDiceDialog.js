import { Capitalize, MasterSkillsList, CurrentCharacterActorIds } from "../misc.js";

export class HelpingDiceDialog extends Dialog {
  static async create(tbActor, opts, onComplete) {
    let skillOrAbility = opts.skillOrAbility;
    let dialogContent = "systems/torchbearer/templates/helping-dice-dialog-content.html";

    let partyMembers = (await CurrentCharacterActorIds())
      .filter((id) => {
        return id !== tbActor.id;
      })
      .map((id) => {
        return game.actors.get(id).data;
      });

    let allSkills = MasterSkillsList();
    let helpSkillAbility1 = "";
    let helpSkillAbility2 = "";
    let helpSkillAbility3 = "";
    let helpSkillAbility4 = "";
    if (allSkills[Capitalize(skillOrAbility)]) {
      let helps = allSkills[Capitalize(skillOrAbility)].help.split(",").map((x) => x.trim());
      helps.length > 0 && helps[0] !== skillOrAbility ? (helpSkillAbility1 = helps[0]) : null;
      helps.length > 1 ? (helpSkillAbility2 = helps[1]) : null;
      helps.length > 2 ? (helpSkillAbility3 = helps[2]) : null;
      helps.length > 3 ? (helpSkillAbility4 = helps[3]) : null;
    }

    let template = await renderTemplate(
      dialogContent,
      Object.assign(
        {
          allSkills,
          partyMembers,
          helpSkillAbility1,
          helpSkillAbility2,
          helpSkillAbility3,
          helpSkillAbility4,
        },
        opts
      )
    );
    new HelpingDiceDialog(tbActor, { content: template }, onComplete, opts).render(true);
  }

  constructor(tbActor, dialogData, onComplete, opts) {
    dialogData = Object.assign(
      {
        title: "Helping Dice",
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: "Complete",
            callback: (html) => {
              let sum = 0;
              html.find(".dice-modifier").each((i, el) => {
                let $radio = $(el);
                if ($radio.prop("checked")) {
                  sum += parseInt($radio.val());
                }
              });
              onComplete(
                Object.assign({}, opts, {
                  totalHelpDice: sum,
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
    super(dialogData, {
      width: 720,
    });
    this.actor = tbActor;
  }

  activateListeners(html) {
    super.activateListeners(html);
    this.fillOutOptions(html);
    html.find("#optionalSkill").change((ev) => {
      let opt = $(ev.currentTarget).val();
      if (opt) {
        html.find(".party-member").each((i, el) => {
          let $row = $(el);
          let actorId = $row.data("actorId");
          let tbActor = game.actors.get(actorId);
          if (!tbActor.tbData().afraid) {
            if (opt && tbActor.getRating(opt)) {
              $row
                .find(".optionalSkillAbility")
                .html(
                  `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-opt" value="1" />`
                );
            } else {
              $row.find(".optionalSkillAbility").html("");
            }
          }
        });
      }
    });
  }

  fillOutOptions(html) {
    let sab = html.find("#skillOrAbility").data("val") || "";
    let ab1 = html.find("#helpSkillAbility1").data("val") || "";
    let ab2 = html.find("#helpSkillAbility2").data("val") || "";
    let ab3 = html.find("#helpSkillAbility3").data("val") || "";
    let ab4 = html.find("#helpSkillAbility4").data("val") || "";
    let opt = html.find("#optionalSkill").val() || "";
    html.find(".party-member").each((i, el) => {
      let $row = $(el);
      let actorId = $row.data("actorId");
      let tbActor = game.actors.get(actorId);
      if (tbActor.tbData().afraid) {
        $row.find(".nature").html("");
        $row.find(".wise").html("");
        $row
          .find(".name")
          .html(
            $row.find(".name").html() +
              "<img src='systems/torchbearer/assets/icons/conditions/afraid.png' title='afraid' style='height:16px;margin-left:4px;border:0;' />"
          );
      } else {
        if (sab && tbActor.getRating(sab)) {
          $row
            .find(".skillOrAbility")
            .html(
              `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-sab" value="1" />`
            );
        }
        if (ab1 && tbActor.getRating(ab1)) {
          $row
            .find(".helpSkillAbility1")
            .html(
              `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-ab1" value="1" />`
            );
        }
        if (ab2 && tbActor.getRating(ab2)) {
          $row
            .find(".helpSkillAbility2")
            .html(
              `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-ab2" value="1" />`
            );
        }
        if (ab3 && tbActor.getRating(ab3)) {
          $row
            .find(".helpSkillAbility3")
            .html(
              `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-ab3" value="1" />`
            );
        }
        if (ab4 && tbActor.getRating(ab4)) {
          $row
            .find(".helpSkillAbility4")
            .html(
              `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-ab4" value="1" />`
            );
        }
        if (opt && tbActor.getRating(opt)) {
          $row
            .find(".optionalSkillAbility")
            .html(
              `<input type="radio" name="party-member-${tbActor.data._id}-help" class="dice-modifier" id="party-member-${tbActor.data._id}-help-opt" value="1" />`
            );
        }
      }
    });
  }
}
