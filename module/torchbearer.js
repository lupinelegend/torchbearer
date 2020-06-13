// Import Modules
import { TorchbearerActor } from "./actor/actor.js";
import { TorchbearerActorSheet } from "./actor/actor-sheet.js";
import { TorchbearerItem } from "./item/item.js";
import { TorchbearerItemSheet } from "./item/item-sheet.js";
import { conflictSheet } from "./conflict.js";

// Import Helpers
import * as chat from "./chat.js";

Hooks.once('init', async function() {

  game.torchbearer = {
    TorchbearerActor,
    TorchbearerItem
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  Hooks.on("renderChatMessage", (app, html, data) => {
    // Event listener for "Luck"
    html.find('#luckBtn').click(ev => {
      chat.fateForLuck(app, html, data);
    });
    // Event listener for "Of Course!"
    html.find('#ofCourseBtn').click(ev => {
      chat.ofCourse(app, html, data);
    });
    // Event listener for "Deeper Understanding"
    html.find('#deeperUnderstandingBtn').click(ev => {
      chat.deeperUnderstanding(app, html, data);
    });
    // Event listener for logging tests
    html.find('#logTestBtn').click(ev => {
      let actor = game.actors.get(data.message.speaker.actor);
      if (actor.data.data.sick === true) {
        ui.notifications.error("You may not log tests when you're sick");
      } else {
        chat.logTest(app, html, data);
      }
    });
  });

  const sheet = new conflictSheet();

  game.settings.register('conflict-sheet', 'partyIntent', {
    name: 'partyIntent',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'conflictCaptain', {
    name: 'conflictCaptain',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'opponentIntent', {
    name: 'opponentIntent',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'opponentName', {
    name: 'opponentName',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'partyDispoCurrent', {
    name: 'partyDispoCurrent',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'partyDispoMax', {
    name: 'partyDispoMax',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'opponentDispoCurrent', {
    name: 'opponentDispoCurrent',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  game.settings.register('conflict-sheet', 'opponentDispoMax', {
    name: 'opponentDispoMax',
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  // https://discordapp.com/channels/170995199584108546/670336275496042502/721144171468947556
  game.socket.on('system.torchbearer', data => {
    if (game.user.isGM) {
      switch (data.name) {
        case 'partyIntent':
          game.settings.set('conflict-sheet', 'partyIntent', data.payload).then( () => sheet.render(true));
          break;
      }
    } else {
      sheet.render(true);
    }
  });

  Hooks.on('ready', (app, html, data) => {
    $('#logo').click(ev => {
      sheet.render(true);
    });
  });
  

  // Define custom Entity classes
  CONFIG.Actor.entityClass = TorchbearerActor;
  CONFIG.Item.entityClass = TorchbearerItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("torchbearer", TorchbearerActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("torchbearer", TorchbearerItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("ifeq", function(arg1, arg2, options) {
    if (arg1 === arg2) {
      return options.fn(this);
    }
  });

  Handlebars.registerHelper('times', function(n, options) {
    var accum = '';
    for(var i = 0; i < n; ++i)
      accum += options.fn(i);
    return accum;
  });

  Handlebars.registerHelper('add', function(a1, a2) {
    return a1 + a2;
  });

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });
});