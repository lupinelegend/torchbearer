/**
 * "Item"s in FoundryVTT include things like spells and classes: this class is inherited by all of them.
 */
export class TorchbearerBaseItem extends Item {
  /**
   * FoundryVTT doesn't provide a default way to have subclasses of actors and items, but we can create them manually
   */
  constructor(data, context = {}) {
    if (context.torchbearer?.correctType) {
      super(data, context);
    } else {
      return new CONFIG.TORCHBEARER.Item.documentClasses[data.type](data, {
        torchbearer: { correctType: true },
        ...context,
      });
    }
  }

  tbData() {
    return this.data.data;
  }

  /**
   * Overridable Callback action
   * @param tbItemOther: the other object
   * @param given: array of items that have already been confirmed
   * @return true if ok to add, false if not and make this object unbundleable
   */
  onBeforeBundleWith(/* tbItemOther, given */) {
    return true;
  }
  /**
   * Overridable Callback action
   * @param container: the inventory container being added to
   * @param given: array of items that have already been confirmed
   * @return true if ok to add, false if should be put on ground
   */
  onAfterAddToInventory(/* container, given */) {
    return true;
  }

  /**
   * Overridable Callback actions whenever the item is consumed as
   * food or drink, etc.
   */
  onBeforeConsumed() {
    return true;
  }
  async onAfterConsumed() {}

  onBeforeActivate() {
    return true;
  }

  async onAfterEquipped(/* equippedEvent */) {}

  /**
   * Overridable Callback action
   * @param container: the inventory container being added to
   * @param given: array of items that have already been confirmed
   * @return nothing but can modify data.data.computed.consumedSlots
   */
  onCalculateConsumedSlots(/* container, given */) {}
}
