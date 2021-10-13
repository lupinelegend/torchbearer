export class CharacterAdjustment {
  constructor(actor) {
    this.actor = actor;
    this.tbData = actor.tbData();
    this.adjustments = {};
  }

  addChecks(traitName, count) {
    let traitKey = "";
    let traits = this.tbData.traits;
    Object.keys(traits).forEach((key, index) => {
      if (traitName === traits[key].name) {
        traitKey = `trait${index + 1}`;
      }
    });
    if (traitKey) {
      let key = `data.traits.${traitKey}.checks.checksEarned`;
      this.sourceAdjustments(key, traits[traitKey].checks.checksEarned);
      this.adjustments[key] += count;
      return true;
    }
    return false;
  }

  useTraitPositively(traitName) {
    // Make sure the Trait is able to be used beneficially
    let tbData = this.tbData;
    if (tbData.angry === true) {
      ui.notifications.error(`ERROR: You've can't use ${traitName} to help when you're angry`);
      return false;
    }

    let traits = tbData.traits;
    let keys = Object.keys(traits);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (traitName === traits[key].name) {
        let lvl1Key = `data.traits.${key}.uses.level1.use1`;
        let lvl2key = `data.traits.${key}.uses.level2.use2`;
        this.sourceAdjustments(lvl1Key, traits[key].uses.level1.use1);
        this.sourceAdjustments(lvl2key, traits[key].uses.level2.use2);
        if (traits[key].level.value === "1") {
          // Return if the trait has already been used this session, else check it off
          if (this.adjustments[lvl1Key]) {
            ui.notifications.error(`ERROR: You've already used ${traitName} this session`);
            return false;
          } else {
            this.adjustments[lvl1Key] = true;
            return true;
          }
        } else if (traits[key].level.value === "2") {
          if (this.adjustments[lvl1Key] && this.adjustments[lvl2key]) {
            ui.notifications.error(`ERROR: You've already used ${traitName} twice this session`);
            return false;
          } else if (!this.adjustments[lvl1Key]) {
            this.adjustments[lvl1Key] = true;
            return true;
          } else if (!this.adjustments[lvl2key]) {
            this.adjustments[lvl2key] = true;
            return true;
          }
        }
      }
    }
    return false;
  }

  spendPersona(amount) {
    let tbData = this.tbData;
    if (amount === 0) return true;
    let valueKey = "data.persona.value";
    let spentKey = "data.persona.spent";
    this.sourceAdjustments(valueKey, tbData.persona.value);
    this.sourceAdjustments(spentKey, tbData.persona.spent);

    if (this.adjustments[valueKey] < amount) {
      ui.notifications.error("ERROR: You don't have enough persona to spend.");
      return false;
    } else {
      this.adjustments[valueKey] -= amount;
      this.adjustments[spentKey] += amount;
      return true;
    }
  }

  sourceAdjustments(key, value) {
    if (Object.prototype.hasOwnProperty.call(this.adjustments, key)) return;
    this.adjustments[key] = value;
  }

  async execute() {
    await this.actor.update(this.adjustments);
  }
}
