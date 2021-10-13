export class TorchbearerActorSheet extends ActorSheet {
  /** @override */
  getData() {
    const data = super.getData();

    return {
      actor: data.actor,
      data: data.actor.data.data,
    };
  }
}
