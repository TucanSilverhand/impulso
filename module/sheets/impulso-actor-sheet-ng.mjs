const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

function buildActorTypeOptions() {
  const configured = Object.keys(CONFIG.Actor?.dataModels ?? game.system.documentTypes?.Actor ?? {});
  return Object.fromEntries(
    configured.map((type) => {
      const key = `IMPULSO.Actor.Types.${type}`;
      const label = game.i18n.has(key) ? game.i18n.localize(key) : type;
      return [type, label];
    })
  );
}

const BaseActorSheet = HandlebarsApplicationMixin(ActorSheetV2);

export class ImpulsoActorSheetNG extends BaseActorSheet {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    classes: ["impulso", "sheet", "actor", "actor-ng"],
    position: { width: 752, height: 730 },
    form: {
      submitOnChange: true,
      submitOnClose: true
    },
    window: {
      ...super.DEFAULT_OPTIONS.window,
      title: (app) => `Sistema Impulso - ${app.document?.name ?? game.i18n.localize("IMPULSO.SystemName")}`,
      resizable: true
    },
    actions: {
      ...super.DEFAULT_OPTIONS.actions,
      changeTab: ImpulsoActorSheetNG.#onChangeTab,
      rollDice: ImpulsoActorSheetNG.#onRollDice
    }
  };

  static PARTS = {
    ...super.PARTS,
    sheet: {
      id: "sheet",
      template: "systems/impulso/templates/actors/actor-sheet-ng.hbs",
      root: true,
      classes: ["impulso", "sheet", "actor", "actor-ng"],
      scrollable: [".sheet-body"]
    }
  };

  tabGroups = {
    primary: "principal"
  };

  static #onChangeTab(event, target) {
    const tab = target.dataset.tab;
    const group = target.dataset.group || "primary";
    this.tabGroups[group] = tab;
    this._activateTabs();
  }

  static async #onRollDice(event, target) {
    const difficulty = Number(this.element.querySelector(".difficulty-select")?.value ?? 15);
    const hasAdvantage = this.element.querySelector(".advantage-checkbox")?.checked ?? false;
    const hasDisadvantage = this.element.querySelector(".disadvantage-checkbox")?.checked ?? false;

    const redCount = 1 + (hasAdvantage ? 1 : 0);
    const blackCount = 1 + (hasDisadvantage ? 1 : 0);

    const roll = new Roll(`${redCount}d12 + ${blackCount}d12`);
    roll.terms[0].options.appearance = { colorset: "impulso-red" };
    roll.terms[2].options.appearance = { colorset: "impulso-black" };
    await roll.evaluate();

    const redValues = roll.terms[0].results.map(r => r.result);
    const blackValues = roll.terms[2].results.map(r => r.result);

    const keptRed = hasAdvantage ? Math.max(...redValues) : redValues[0];
    const keptBlack = hasDisadvantage ? Math.min(...blackValues) : blackValues[0];
    const total = keptRed + keptBlack;

    const redDice = redValues.map(v => ({ value: v, discarded: hasAdvantage && v !== keptRed }));
    const blackDice = blackValues.map(v => ({ value: v, discarded: hasDisadvantage && v !== keptBlack }));

    const diff = total - difficulty;
    const outcome = ImpulsoActorSheetNG.#resolveOutcome(diff);
    const content = await foundry.applications.handlebars.renderTemplate("systems/impulso/templates/chat/roll-card.hbs", {
      actorName: this.document.name,
      actorImg: this.document.img,
      total,
      difficulty,
      diff,
      outcome,
      redDice,
      blackDice,
      hasAdvantage,
      hasDisadvantage
    });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content,
      rolls: [roll]
    });
  }

  static #resolveOutcome(diff) {
    const detailNs = game.settings.get("impulso", "sheetStyle") === "lite" ? "OutcomeLite" : "Outcome";
    const label = (key) => game.i18n.localize(`IMPULSO.Outcome.${key}.label`);
    const detail = (key) => game.i18n.localize(`IMPULSO.${detailNs}.${key}.detail`);
    if (diff >= 9)  return { type: "success", icon: "fa-solid fa-sun",                  label: label("absoluteSuccess"),    detail: detail("absoluteSuccess") };
    if (diff >= 6)  return { type: "success", icon: "fa-solid fa-star",                 label: label("greatSuccess"),       detail: detail("greatSuccess") };
    if (diff >= 3)  return { type: "success", icon: "fa-solid fa-circle-check",         label: label("significantSuccess"), detail: detail("significantSuccess") };
    if (diff >= 0)  return { type: "success", icon: "fa-solid fa-check",                label: label("simpleSuccess"),      detail: "" };
    if (diff >= -3) return { type: "partial", icon: "fa-solid fa-triangle-exclamation", label: label("simpleFailure"),      detail: detail("simpleFailure") };
    if (diff >= -6) return { type: "failure", icon: "fa-solid fa-xmark",                label: label("significantFailure"), detail: detail("significantFailure") };
    return            { type: "failure",      icon: "fa-solid fa-skull",                label: label("absoluteFailure"),    detail: detail("absoluteFailure") };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system ?? {};

    context.actor = actor;
    context.document = actor;
    context.system = system;
    context.types = buildActorTypeOptions();
    context.owner = actor.isOwner;
    context.editable = this.isEditable;
    context.showCorruption = game.settings.get("impulso", "enableCorruption");

    const estadoActual = system.estado ?? new Set();

    context.stateOptions = [
      { id: "rasguno1",    label: game.i18n.localize("IMPULSO.Estado.rasguno1") },
      { id: "rasguno2",    label: game.i18n.localize("IMPULSO.Estado.rasguno2") },
      { id: "herida",      label: game.i18n.localize("IMPULSO.Estado.herida") },
      { id: "heridaGrave", label: game.i18n.localize("IMPULSO.Estado.heridaGrave") },
      { id: "moribundo",   label: game.i18n.localize("IMPULSO.Estado.moribundo") }
    ].map((option) => ({
      ...option,
      checked: estadoActual.has?.(option.id) ?? false
    }));

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this._activateTabs();
  }

  _activateTabs() {
    const html = this.element;
    const tabGroups = this.tabGroups;

    for (const [group, activeTab] of Object.entries(tabGroups)) {
      const tabs = html.querySelectorAll(`.tabs[data-group="${group}"] .item`);
      const contents = html.querySelectorAll(`.tab[data-group="${group}"]`);

      tabs.forEach(tab => {
        const tabName = tab.dataset.tab;
        if (tabName === activeTab) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });

      contents.forEach(content => {
        const tabName = content.dataset.tab;
        if (tabName === activeTab) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    }
  }

  _prepareSubmitData(event, form, formData) {
    const states = [];
    const keysToDelete = [];

    for (const [key, value] of formData.entries()) {
      const match = key.match(/^system\.estadoFlags\.(\w+)$/);
      if (!match) continue;
      keysToDelete.push(key);
      if (value === match[1]) states.push(match[1]);
    }
    for (const key of keysToDelete) formData.delete(key);

    const submitData = super._prepareSubmitData(event, form, formData);
    foundry.utils.setProperty(submitData, "system.estado", states);
    return submitData;
  }
}
