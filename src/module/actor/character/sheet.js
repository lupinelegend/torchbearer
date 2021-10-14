import { TorchbearerBaseActorSheet } from "../base-actor-sheet";
import { alternateContainerType, canFit } from "@inventory/inventory";
import { PlayerRoll } from "@rolls/playerRoll";

export class TorchbearerCharacterSheet extends TorchbearerBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "character"],
      template: "systems/torchbearer/templates/actor/character-sheet.html.hbs",
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
        {
          navSelector: ".inventory-tabs",
          contentSelector: ".inventory-body",
          initial: "on-person",
        },
      ],
      dragDrop: [{ dragSelector: ".items-list .item", dropSelector: null }],
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    // Condition checkboxes
    const conditionStates = [
      data.data.hungryandthirsty,
      data.data.angry,
      data.data.afraid,
      data.data.exhausted,
      data.data.injured,
      data.data.sick,
      data.data.dead,
    ];
    const inc = 100 / 7;
    let conditionsTrue = 0;
    conditionStates.forEach((element) => {
      if (element === true) {
        conditionsTrue++;
      }
    });
    data.data.conditionProgress = Math.round(conditionsTrue * inc);

    // Check skills to see if any can be advanced
    let skillsArray = [];
    const skillList = data.data.skills;
    Object.keys(skillList).forEach((key) => {
      skillsArray.push(skillList[key].name);
    });
    skillsArray.forEach((key) => {
      if (data.data.skills[key].rating > 0) {
        if (
          data.data.skills[key].pass >= data.data.skills[key].rating &&
          data.data.skills[key].fail >= data.data.skills[key].rating - 1
        ) {
          ui.notifications.info(
            `You may now advance ${key} from ${data.data.skills[key].rating} to ${data.data.skills[key].rating + 1}`
          );
        }
      } else if (data.data.skills[key].rating === 0 && data.data.nature.max > 0) {
        if (data.data.skills[key].pass + data.data.skills[key].fail >= data.data.nature.max) {
          ui.notifications.info(`You may now advance ${key} to 2`);
        }
      }
    });

    // Check abilities to see if any can be advanced
    let abilitiesArray = ["will", "health", "nature", "resources", "circles"];
    let displayArray = ["Will", "Health", "Nature", "Resources", "Circles"];
    abilitiesArray.forEach((key, index) => {
      if (data.data[key].pass === data.data[key].value && data.data[key].fail === data.data[key].value - 1) {
        ui.notifications.info(
          `You may now advance ${displayArray[index]} from ${data.data[key].value} to ${data.data[key].value + 1}`
        );
      }
    });

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    this.html = html;

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    //html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find(".item-name.clickable").click((ev) => {
      console.log(ev.currentTarget);
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      // const equip = item.data.data.equip;
      item.sheet.render(true);
    });

    // Update Inventory Item
    html.find(".spell-name.clickable").click((ev) => {
      const spell = this.actor.items.get(ev.currentTarget.title);
      console.log(spell);
      spell.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");

      this.actor.removeItemFromInventory(li.data("itemId")).then(() => {
        // Get the equipment slot of the item being deleted
        li.slideUp(200, () => this.render(false));
      });
    });

    // Delete Spell Item
    html.find(".spell-delete").click((ev) => {
      document.getElementById(ev.currentTarget.name).remove();
      this.actor.removeItemFromInventory(ev.currentTarget.name);
    });

    // Update spell data
    html.find(".spell-toggle").click((ev) => {
      // ev.preventDefault();
      const spell = this.actor.items.get(ev.currentTarget.id);
      let checkState = ev.currentTarget.checked;
      console.log(spell);
      switch (ev.currentTarget.title) {
        case "cast":
          spell.update({ "data.cast": checkState });
          break;
        case "library":
          spell.update({ "data.library": checkState });
          break;
        case "spellbook":
          spell.update({ "data.spellbook": checkState });
          break;
        case "memorized":
          spell.update({ "data.memorized": checkState });
          break;
        case "scroll":
          spell.update({ "data.scroll": checkState });
          break;
        case "supplies":
          spell.update({ "data.supplies": checkState });
          break;
      }
    });

    // Drop Inventory Item
    html.find(".item-drop").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      let tbItem = this.actor.items.get(li.data("itemId"));
      tbItem
        .update({
          data: {
            equip: "On Ground",
            carried: "Ground",
            slots: 1,
          },
        })
        .then(() => {
          setTimeout(() => {
            this.actor._onUpdate({ items: true }, { render: true });
          }, 0);
        });
    });

    // Drink Item
    html.find(".item-consume").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      let tbItem = this.actor.items.get(li.data("itemId"));
      tbItem.consumeOne().then(() => {
        setTimeout(() => {
          this.actor._onUpdate({ items: true }, { render: true });
        }, 0);
      });
    });

    // Activate Item
    html.find(".item-activate").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      let tbItem = this.actor.items.get(li.data("itemId"));
      tbItem.toggleActive().then(() => {
        setTimeout(() => {
          this.actor._onUpdate({ items: true }, { render: true });
        }, 0);
      });
    });

    // Rollable abilities
    html.find(".rollable").click(this._onRoll.bind(this));

    // Event listener for advancing abilities
    html.find(".advanceAbility").click((ev) => {
      console.log(ev.currentTarget.innerText);
    });

    // Event listener for advancing skills
    html.find(".advanceSkill").click((ev) => {
      let skill = ev.currentTarget.innerText;

      if (this.actor.data.data.skills[skill].rating > 0) {
        // If skill can be advanced, do so then clear passes and failures
        if (
          this.actor.data.data.skills[skill].pass >= this.actor.data.data.skills[skill].rating &&
          this.actor.data.data.skills[skill].fail >= this.actor.data.data.skills[skill].rating - 1
        ) {
          let update = {
            ["data.skills." + skill + ".rating"]: this.actor.data.data.skills[skill].rating + 1,
            ["data.skills." + skill + ".pass"]: 0,
            ["data.skills." + skill + ".fail"]: 0,
          };

          this.actor.update(update);
        }
      } else if (this.actor.data.data.skills[skill].rating === 0) {
        if (
          this.actor.data.data.skills[skill].pass + this.actor.data.data.skills[skill].fail >=
          this.actor.data.data.nature.max
        ) {
          let update = {
            ["data.skills." + skill + ".rating"]: 2,
            ["data.skills." + skill + ".pass"]: 0,
            ["data.skills." + skill + ".fail"]: 0,
          };
          this.actor.update(update);
        }
      }
    });

    html.find("#overburdenToggle").click(() => {
      this.actor.update({
        data: {
          overburdened: !this.actor.tbData().overburdened,
        },
      });
    });

    html.find("#primary-tab-inventory").click(() => {
      setTimeout(() => {
        this._tabs[1].activate(this._tabs[1].active, true);
      }, 0);
    });

    // // Event listener for advancing skills
    // html.find('.rollable').click(this._advanceSkill.bind(this));

    // Class changes
    // html.find('#classDropdown').change(ev => {
    //   let className = ev.currentTarget.selectedOptions[0].value;
    //   const classPack = game.packs.get("torchbearer.classes");
    //   let entry;
    //   classPack.getIndex().then(index => classPack.index.find(e => e.name === className)).then(f => {
    //     entry = f;
    //     classPack.getEntity(entry.data._id).then(cl => {
    //       console.log(cl);
    //       // I can access compendium classes from here.
    //     });
    //   });
    // });
  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();

    const header = event.currentTarget;

    // Get the type of item to create.
    const type = header.dataset.type;

    // Grab any data associated with this control.
    const equipSlot = header.type;
    const data = duplicate(header.dataset);
    data.equip = equipSlot;

    // Initialize a default name.
    const name = `New ${type.capitalize()}`;

    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Determine attribute/skill to roll
    let skillOrAbility = dataset.label;

    new PlayerRoll(this.actor).showDialog(skillOrAbility);
  }

  closestCompatibleContainer(tbItem, target) {
    let $closestContainer = $(target).closest(".inventory-container");
    if (!$closestContainer.length) {
      return {};
    }
    const containerType = $closestContainer.data("containerType");
    const containerId = $closestContainer.data("itemId");
    if (tbItem.isCompatibleContainer(containerType)) {
      return {
        containerType,
        containerId: containerId || "",
        slotsTaken: tbItem.slotsTaken(containerType),
      };
    } else {
      return this.closestCompatibleContainer(tbItem, $closestContainer.parent());
    }
  }

  pickAnotherContainerIfNecessaryDueToItemSize(item) {
    if (!canFit(item, item.data.data.equip, this.actor.data.data.computed.inventory)) {
      if (canFit(item, alternateContainerType(item), this.actor.data.data.computed.inventory)) {
        return alternateContainerType(item);
      }
    }
  }

  async handleDropItem(item) {
    // item.document means we got an ItemData rather than a TorchbearerBaseItem
    const tbItem = item.document ? item.document : item;

    if (tbItem.type === "Spell") {
      console.log("Yer a wizard, Harry");
    } else {
      if (tbItem.data) {
        await tbItem.syncEquipVariables();

        let oldContainerId = tbItem.data.data.containerId;
        let { containerType, containerId, slotsTaken } = this.closestCompatibleContainer(tbItem, event.target);
        if (!containerType) {
          //No closest container specified, so pick one.
          // First, we know it's not pack w/o a containerId, so if it is the item's gonna need
          // updating.
          if (tbItem.data.data.equip === "Pack") {
            tbItem.data.data.equip = tbItem.data.data.equipOptions.option1.value;
            tbItem.data.data.slots = tbItem.data.data.slotOptions.option1.value;
            containerType = tbItem.data.data.equip;
            containerId = null;
            slotsTaken = tbItem.data.data.slots;
          }
          let newContainerType = this.pickAnotherContainerIfNecessaryDueToItemSize(tbItem);
          if (newContainerType) {
            slotsTaken = tbItem.slotsTaken(newContainerType);
            containerType = newContainerType;
          }
        }
        if (containerType) {
          let update = { data: { equip: containerType, containerId: containerId, slots: slotsTaken } };
          await tbItem.update(update);
          await tbItem.onAfterEquipped({ containerType, containerId });
          this.actor._onUpdate({ items: true }, { render: true });
          if (oldContainerId) {
            let oldContainer = this.actor.items.get(oldContainerId);
            setTimeout(() => {
              oldContainer.sheet.render(false);
            }, 0);
          }
          if (containerId) {
            let newContainer = this.actor.items.get(containerId);
            setTimeout(() => {
              newContainer.sheet.render(false);
            }, 0);
          }
        }
      }
    }

    return tbItem;
  }

  /** @override */
  async _onDrop(event) {
    let item = await super._onDrop(event);
    console.log(item);

    // super._onDrop sometimes returns an array (e.g. drop from compendium) and sometimes not (e.g. move in inventory)
    if (Array.isArray(item)) {
      return item.map(async (i) => await this.handleDropItem(i));
    } else {
      return await this.handleDropItem(item);
    }
  }

  /** @override */
  _onSortItem(event, itemData) {
    super._onSortItem(event, itemData);
    let item = this.actor.items.get(itemData._id);
    return item.data;
  }
}
