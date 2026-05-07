const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

function buildItemTypeOptions() {
  const configured = Object.keys(CONFIG.Item?.dataModels ?? game.system.documentTypes?.Item ?? {});
  return Object.fromEntries(
    configured.map((type) => {
      const key = `IMPULSO.Item.Types.${type}`;
      const label = game.i18n.has(key) ? game.i18n.localize(key) : type;
      return [type, label];
    })
  );
}

const BaseItemSheet = HandlebarsApplicationMixin(ItemSheetV2);

export class ImpulsoItemSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ["impulso", "sheet", "item"],
    position: { width: 600, height: 520 },
    form: {
      submitOnChange: true,
      submitOnClose: true
    },
    window: {
      ...super.DEFAULT_OPTIONS.window,
      title: (app) => app.document?.name ?? game.i18n.localize("IMPULSO.SystemName")
    }
  };

  static PARTS = {
    ...super.PARTS,
    sheet: {
      id: "sheet",
      template: "systems/impulso/templates/items/item-sheet.hbs",
      root: true,
      classes: ["impulso", "sheet", "item"]
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    context.item = item;
    context.document = item;
    context.system = item.system;
    context.types = buildItemTypeOptions();
    context.owner = item.isOwner;
    context.editable = this.isEditable;
    return context;
  }
}
