export class TorchbearerBaseItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["torchbearer", "sheet", "base-item"],
      width: 450,
      height: 450,
    });
  }

  /** @override */
  getData() {
    const data = super.getData();

    if (this.item.actor) data._actor_id = this.item.actor.data._id;

    return data;
  }

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }
}
