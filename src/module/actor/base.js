export class TorchbearerBaseActor extends Actor {
  _onUpdate(data, options, userId, context) {
    super._onUpdate(data, options, userId, context);
    game.grind.updateGrind(null, "actor._onUpdate");
  }

  /**
   * FoundryVTT doesn't provide a default way to have subclasses of actors and items, but we can create them manually
   */
  constructor(data, context = {}) {
    if (context.torchbearer?.correctType) {
      super(data, context);
    } else {
      return new CONFIG.TORCHBEARER.Actor.documentClasses[data.type](data, {
        torchbearer: { correctType: true },
        ...context,
      });
    }
  }

  tbData() {
    return this.data.data;
  }
}
