import { CONFLICT_TYPES } from "./types.js";
import { DispoDialog } from "./dispoDialog.js";
import { PlayerRoll } from "../rolls/playerRoll.js";
import { Capitalize, CurrentCharacterActorIds } from "../misc.js";

export class ConflictSheet extends Application {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Conflict Sheet",
      classes: ["torchbearer", "sheet", "conflict"],
      template: "systems/torchbearer/templates/conflict-template.html",
      width: 1050,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "setup" }],
      dragDrop: [{ dragSelector: null, dropSelector: null }],
    });
  }

  /** @override */
  async getData() {
    let data = super.getData();

    data.conflict = await this.currentConflict();
    data.conflictTypes = CONFLICT_TYPES;

    if (game.user.isGM) {
      data.isGM = true;
    }
    data.computed = {};
    // Create an array of actor names

    this._conflictData = data;
    return data;
  }

  async loadChars() {
    if (game.user.isGM) {
      let actorIds = await CurrentCharacterActorIds();
      let engagedCharacterActors = {};
      for (let i = 0; i < actorIds.length; i++) {
        let actorId = actorIds[i];
        let tbActor = game.actors.get(actorId);
        let char = {
          name: tbActor.name,
          id: actorId,
          weapons: [],
          equipped: "",
          dispo: 0,
        };
        let j = 0;
        let weaponArray = [];

        while (j < tbActor.tbData().computed.inventory["Hands (Carried)"].slots.length) {
          weaponArray.push(tbActor.tbData().computed.inventory["Hands (Carried)"].slots[j]);
          j++;
        }
        weaponArray = weaponArray.concat(
          Object.keys(tbActor.tbData().computed.spells).reduce((accum, circle) => {
            return accum.concat(tbActor.tbData().computed.spells[circle].map((tbItem) => tbItem.data));
          }, [])
        );

        char.weapons = weaponArray;
        engagedCharacterActors[actorId] = char;
      }
      let currentConflict = await this.currentConflict();
      let newEngagedActors = Object.assign({}, duplicate(currentConflict).engagedActors, engagedCharacterActors);
      await this.updateConflict({ partyOrder: actorIds, engagedActors: newEngagedActors }, "loadChars");
    }
  }
  async currentConflict() {
    let currentConflict = await game.settings.get("conflict-sheet", "currentConflict");
    if (!currentConflict || currentConflict.dataType !== "conflict") {
      return await this.resetConflict();
    }
    return currentConflict;
  }

  async resetConflict() {
    if (game.user.isGM) {
      const newConflict = {
        dataType: "conflict",
        state: "setup",
        rounds: [],
        partyOrder: [],
        enemyOrder: [],
        engagedActors: {},
        engagedEnemies: {},
        partyIntent: "",
        opponentIntent: "",
        conflictCaptain: "",
        conflictType: "",
        partyDispoCurrent: 0,
        partyDispoMax: 0,
        opponentDispoCurrent: 0,
        opponentDispoMax: 0,
        active: true,
      };
      await this.updateConflict(newConflict, "resetConflict");
      return newConflict;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".conflict-field").change((ev) => {
      let $target = $(ev.currentTarget);
      const fieldName = $target.attr("name");
      const dtype = $target.data("dtype");
      let value = $target.val();
      if ("Number" === dtype) {
        value = parseInt(value);
      }
      this.updateConflict({ [fieldName]: value }, "conflict.conflict-field");
    });

    html.find(".conflict-actor-field").change((ev) => {
      let $target = $(ev.currentTarget);
      const fieldName = $target.attr("name");
      const dtype = $target.data("dtype");
      let actorID = $target.closest(".actor").data("actorId");
      let value = $target.val();
      if ("Number" === dtype) {
        value = parseInt(value);
      }

      let engagedActors = duplicate(this._conflictData.conflict.engagedActors);
      engagedActors[actorID][fieldName] = value;

      this.updateConflict({ engagedActors: engagedActors }, "conflict.actor-field");
    });

    html.find("#playerDispoRoll").click(() => {
      this.playerDispoDialog();
    });

    html.find("#logConflict").on("click", async () => {
      console.log(this._conflictData);
    });
    html.find("#reloadTemplate").on("click", () => {
      delete _templateCache[this.options.template];
      this.render(true);
    });
    html.find("#resetConflict").on("click", async () => {
      await this.resetConflict();
      this.loadChars();
    });
    html.find("#loadChars").on("click", async () => {
      this.loadChars();
    });
    html.find(".actor .actor-image, .actor .actor-name").on("click", (evt) => {
      game.actors.get($(evt.currentTarget).closest(".actor").data("actorId")).sheet.render(true);
    });

    html.find(".conflict-monster-field").change((ev) => {
      console.log(ev);
      let attrName = ev.currentTarget.name;
      // Not the actorID, just the key associated with this monster in the conflict object
      let monsterID = ev.currentTarget.title;
      let weaponValue = ev.currentTarget.value;

      let engagedEnemies = duplicate(this._conflictData.conflict.engagedEnemies);
      engagedEnemies[monsterID][attrName] = weaponValue;
      this.updateConflict({ engagedEnemies: engagedEnemies }, "conflict-monster-field");
    });
  }

  /** @override */
  async _onDrop(event) {
    // Try to extract the data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }

    // Check to see if the dropped entity is a Monster
    let tbMonster;
    let flag = false;
    if (data.id) {
      let temp = game.actors.get(data.id);
      if (temp.data.type === "Monster") {
        tbMonster = temp.data;
      } else {
        console.log("Error: Dropped entity is not a Monster");
        flag = true;
      }
    } else {
      console.log("Error: Dropped entity has no ID");
      flag = true;
    }
    console.log(tbMonster);
    // Return if the dropped entity isn't a Monster
    if (flag === true) {
      return;
    }

    // Update the Conflict object with monster info

    // Get the list of engagedEnemies
    let currentConflict = await this.currentConflict();
    let engagedEnemyActors = currentConflict.engagedEnemies;
    console.log(engagedEnemyActors);

    let added = false;
    Object.keys(engagedEnemyActors).forEach((element) => {
      if (element === tbMonster.data._id) {
        let keyID = tbMonster.data._id + Object.keys(engagedEnemyActors).length;

        // Add the dropped monster to the list
        engagedEnemyActors[keyID] = {
          name: tbMonster.name,
          id: tbMonster.data._id,
          weapons: tbMonster.data.weapons,
          equipped: "",
          dispo: 0,
        };
        added = true;
      }
    });

    if (added !== true) {
      // Add the dropped monster to the list
      engagedEnemyActors[tbMonster.data._id] = {
        name: tbMonster.name,
        id: tbMonster.data._id,
        weapons: tbMonster.data.weapons,
        equipped: "",
        dispo: 0,
      };
    }

    // Update the currentConflict object with the updated engagedEnemies list
    let newEngagedEnemies = Object.assign({}, duplicate(currentConflict).engagedEnemies, engagedEnemyActors);
    await this.updateConflict({ engagedEnemies: newEngagedEnemies }, "onDrop");
  }

  playerDispoDialog() {
    let { conflictCaptain, partyOrder, conflictType } = this._conflictData.conflict;
    if (!conflictCaptain || !conflictType) {
      ui.notifications.error("Please select a conflict captain and conflict type");
      return;
    }
    if (!game.user.isGM && !this.findConflictCaptain(conflictCaptain).isOwner) {
      ui.notifications.error("Only the Conflict Captain or GM can roll Disposition");
      return;
    }

    DispoDialog.create(conflictCaptain, partyOrder, conflictType, this.rollDispo.bind(this));
  }

  rollDispo(type, skill, ability, hungry, exhausted) {
    console.log(type, skill, ability, hungry, exhausted);
    let { conflictCaptain } = this._conflictData.conflict;
    console.log(conflictCaptain);
    let tbCharacter = this.findConflictCaptain(conflictCaptain);
    const dispoRollModifiers = [];
    dispoRollModifiers.push({
      name: ability,
      label: Capitalize(ability),
      effect: tbCharacter.getRating(ability),
    });
    if (hungry) {
      dispoRollModifiers.push({
        name: "hungry",
        label: "Hungry",
        effect: "-1",
      });
    }
    if (exhausted) {
      dispoRollModifiers.push({
        name: "exhausted",
        label: "Exhausted",
        effect: "-1",
      });
    }
    new PlayerRoll(tbCharacter).showDialog(skill, { ob: 0, rollType: "disposition" }, dispoRollModifiers);
  }

  findConflictCaptain(conflictCaptain) {
    let roller = null;
    game.actors._source.forEach((element) => {
      if (element.name === conflictCaptain) {
        roller = element.data._id;
      }
    });
    console.log(roller);
    return game.actors.get(roller);
  }

  async updateConflict(changes, source) {
    if (!game.user.isGM && changes) {
      this.sendMessage({ type: "requestConflictChange", source: { name: game.user.name }, changes: changes });
    } else {
      if (changes) {
        if (source !== "resetConflict") {
          changes = Object.assign({}, await this.currentConflict(), changes);
        }
        await game.settings.set("conflict-sheet", "currentConflict", changes);
      }
      this._hasUpdate = true;
      if (!this._updateSources) this._updateSources = [];
      this._updateSources.push(source);
      this.onUpdate();
      setTimeout(() => {
        if (this._hasUpdate) {
          this.sendMessage({ type: "conflictChanged", source: this._updateSources });
          this._hasUpdate = false;
          this._updateSources = [];
        }
      }, 1000);
    }
  }

  onUpdate() {
    this.render(false);
  }

  handleMessage(payload) {
    switch (payload.type) {
      case "conflictChanged":
        console.log("Informed of conflict change");
        console.log(payload);
        this.onUpdate();
        break;
      case "requestConflictChange":
        if (game.user.isGM) {
          this.updateConflict(payload.changes, payload.source).then(() => this.render());
        }
        break;
    }
  }

  sendMessage(message) {
    game.socket.emit("system.torchbearer", {
      messageType: "conflict",
      name: "conflict",
      payload: message,
    });
  }
}

Handlebars.registerHelper("renderConflictRounds", function (rounds) {
  return `<div>Number of Rounds: ${rounds.length}</div>`;
});
