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
    const baseData = super.getData();

    return {
      item: baseData.item,
      data: baseData.item.data.data,
      _actor_id: baseData.item.actor?.data?._id,
      editable: baseData.editable,
    };
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
