// Import Modules
import { TorchbearerActor } from "./actor/actor.js";
import { TorchbearerActorSheet } from "./actor/actor-sheet.js";
import { TorchbearerItem } from "./item/item.js";
import { TorchbearerItemSheet } from "./item/item-sheet.js";

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

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  Handlebars.registerHelper('renderInventory', function(capacity, inventory, placeholder) {
    let html = "";
    let consumed = 0;
    inventory.slots.forEach((item) => {
      consumed += item.data.slots;
      for (let i = 0; i < item.data.slots; i++) {
        if(i === 0) {
          html +=
              `<li class="item flexrow" data-item-id="${item._id}" data-item-type="${item.data.equip}">
                  <div class="item-image"><img src="${item.img}" title="${item.name}" alt="${item.name}" width="24" height="24"/></div>
                  <h4 class="item-name" style="font-family: Souvenir-Medium;">${item.name}</h4>
                  <div class="item-controls">
                      <a class="item-control item-edit" title="Edit Item" style="margin-right: 5px;"><i class="fas fa-edit"></i></a>
                      <a class="item-control item-delete" title="Delete Item"><i class="fas fa-trash"></i></a>
                  </div>
              </li>`;
        } else {
          html +=
              `<li class="item flexrow secondary-slot-consumed">
                  <div class="item-image" style="width:24px;height:24px"></div>
                  <h4 class="item-name" style="font-family: Souvenir-Medium;">${item.name}</h4>
              </li>`;
        }
      }
    });
    for(let i = consumed; i < capacity; i++) {
      html +=
          `<li class="flexrow placeholder">
              <h4 class="item-name" style="font-family: Souvenir-Medium;">[${placeholder}]</h4>
          </li>`;
    }
    return html;
  });
});