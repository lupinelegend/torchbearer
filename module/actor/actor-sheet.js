export class TorchbearerActorSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "actor"],
      width: 617,
      height: 848,
    });
  }

  /** @override */
  getData() {
    const data = super.getData();

    return {
      actor: data.actor,
      data: data.actor.data.data,
    };
  }
}
