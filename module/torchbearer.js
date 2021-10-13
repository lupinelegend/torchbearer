// Import Modules
import { TorchbearerActor } from "./actor/actor.js";
import { TorchbearerCharacterSheet } from "./actor/character-sheet.js";
import { TorchbearerItem } from "./item/item.js";
import { TorchbearerItemSheet } from "./item/item-sheet.js";
import { ConflictSheet } from "./conflict/conflict.js";
import { GrindSheet } from "./grind.js";

// Import Helpers
import * as chat from "./chat.js";
import { Capitalize } from "./misc.js";

Hooks.once("init", async function () {
  game.torchbearer = {
    TorchbearerActor,
    TorchbearerItem,
  };

  game.gmIsActive = () => {
    for (let i = 0; i < game.users.entities.length; i++) {
      const user = game.users.entities[i];
      if (user.isGM && user.active) {
        return true;
      }
    }
    return false;
  };
  game.grind = new GrindSheet();
  game.conflict = new ConflictSheet();

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2,
  };

  // Event listeners for chat message buttons
  Hooks.on("renderChatMessage", (app, html, data) => {
    // Event listener for "Luck"
    html.find("#luckBtn").click(() => {
      chat.fateForLuck(app, html, data);
    });
    // Event listener for "Of Course!"
    html.find("#ofCourseBtn").click(() => {
      chat.ofCourse(app, html, data);
    });
    // Event listener for "Deeper Understanding"
    html.find("#deeperUnderstandingBtn").click(() => {
      chat.deeperUnderstanding(app, html, data);
    });
    // Event listener for logging tests
    html.find("#logTestBtn").click((ev) => {
      let actor = game.actors.get(data.message.speaker.actor);
      if (actor.data.data.sick === true) {
        ui.notifications.error("You may not log tests when you're sick");
      } else {
        let $target = $(ev.currentTarget);
        if (String($target.data("logged")) === "false") {
          chat.logTest(app, html, $target.closest(".tb-roll-data").data("skillOrAbility"), data);
          $target.data("logged", "true");
          $target.find("i").removeClass("fa-file-signature").addClass("fa-check");
        }
      }
    });
  });

  game.settings.register("conflict-sheet", "currentConflict", {
    name: "currentConflict",
    scope: "world",
    config: true,
    default: {},
    type: Object,
  });
  game.settings.register("grind-sheet", "theGrind", {
    name: "theGrind",
    scope: "world",
    config: true,
    default: {},
    type: Object,
  });

  // Updates inputs to the Conflict Sheet across clients
  // https://discordapp.com/channels/170995199584108546/670336275496042502/721144171468947556
  game.socket.on("system.torchbearer", (data) => {
    if (data.messageType === "grind") {
      game.grind.handleMessage(data.payload);
      return;
    }
    if (data.messageType === "conflict") {
      game.conflict.handleMessage(data.payload);
    }
  });

  // Event listener which opens the Conflict Sheet when the Foundry icon is clicked
  Hooks.on("ready", () => {
    $("#logo").click(() => {
      // game.conflict.render(true);
      new Dialog({
        title: "Torchbearer",
        buttons: {
          grind: {
            label: "The Grind",
            callback: () => {
              game.grind.render(true);
            },
          },
          conflict: {
            label: "Conflict",
            callback: () => {
              game.conflict.render(true);
            },
          },
        },
      }).render(true);
    });
  });

  // Define custom Entity classes
  CONFIG.Actor.documentClass = TorchbearerActor;
  CONFIG.Item.documentClass = TorchbearerItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("torchbearer", TorchbearerCharacterSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("torchbearer", TorchbearerItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper("concat", function () {
    var outStr = "";
    for (var arg in arguments) {
      if (typeof arguments[arg] != "object") {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper("orderedEach", function (obj, keys, options) {
    let accum = "";
    for (let i = 0; i < keys.length; i++) {
      let value = obj[keys[i]];
      if (value) {
        accum += options.fn(value);
      }
    }
    return accum;
  });

  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("cap", function (str) {
    return Capitalize(str);
  });

  Handlebars.registerHelper("ifeq", function (arg1, arg2, options) {
    if (arg1 === arg2) {
      return options.fn(this);
    }
  });

  Handlebars.registerHelper("times", function (n, options) {
    var accum = "";
    for (var i = 0; i < n; ++i) accum += options.fn(i);
    return accum;
  });

  Handlebars.registerHelper("add", function (a1, a2) {
    return a1 + a2;
  });

  Handlebars.registerHelper("json", function (context) {
    return JSON.stringify(context);
  });
});
