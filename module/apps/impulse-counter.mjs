const { ApplicationV2 } = foundry.applications.api;
const { HandlebarsApplicationMixin } = foundry.applications.api;
import { IMPULSO_MODULE_SCOPE } from "../config/constants.mjs";

const BaseApp = HandlebarsApplicationMixin(ApplicationV2);

export class ImpulseCounterApp extends BaseApp {
  static DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "impulse-counter",
    classes: ["impulso", "impulse-counter"],
    position: { width: 200, height: "auto", top: 80, left: 16 },
    window: {
      ...super.DEFAULT_OPTIONS.window,
      title: "IMPULSO.ImpulseCounter.Title",
      minimizable: false,
      resizable: false,
      controls: []
    },
    actions: {
      ...super.DEFAULT_OPTIONS.actions,
      incrementImpulse: ImpulseCounterApp.#onIncrementImpulse,
      decrementImpulse: ImpulseCounterApp.#onDecrementImpulse,
      incrementConsequence: ImpulseCounterApp.#onIncrementConsequence,
      decrementConsequence: ImpulseCounterApp.#onDecrementConsequence
    }
  };

  static PARTS = {
    ...super.PARTS,
    counter: {
      id: "counter",
      template: "systems/impulso/templates/apps/impulse-counter.hbs",
      root: true,
      classes: ["impulse-counter-body"]
    }
  };

  /** @type {boolean} */
  _positionRestored = false;

  async close(options = {}) {
    if (options.force) return super.close(options);
    return;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.impulseCount = game.settings.get(IMPULSO_MODULE_SCOPE, "impulseCounter");
    context.consequenceCount = game.settings.get(IMPULSO_MODULE_SCOPE, "consequenceCounter");
    context.isGM = game.user.isGM;
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    // GM direct input handlers
    for (const input of this.element.querySelectorAll("input.counter-input")) {
      input.addEventListener("change", (ev) => {
        const val = Math.max(0, parseInt(ev.target.value) || 0);
        const setting = ev.target.dataset.setting;
        if (setting) game.settings.set(IMPULSO_MODULE_SCOPE, setting, val);
      });
    }

    // Restore saved position on first render
    if (!this._positionRestored) {
      const saved = game.settings.get(IMPULSO_MODULE_SCOPE, "impulseCounterPosition");
      if (saved?.left !== undefined && saved?.top !== undefined) {
        this.setPosition({ left: saved.left, top: saved.top });
      }
      this._positionRestored = true;
    }
  }

  setPosition(pos = {}) {
    const result = super.setPosition(pos);
    if (this._positionRestored) {
      clearTimeout(this._positionSaveTimeout);
      this._positionSaveTimeout = setTimeout(() => {
        const { left, top } = this.position;
        game.settings.set(IMPULSO_MODULE_SCOPE, "impulseCounterPosition", { left, top });
      }, 300);
    }
    return result;
  }

  // ─── Actions ───────────────────────────────────────────────

  static async #onModify(setting, delta) {
    const current = game.settings.get(IMPULSO_MODULE_SCOPE, setting);
    const newValue = Math.max(0, current + delta);
    if (newValue === current) return;
    if (game.user.isGM) {
      await game.settings.set(IMPULSO_MODULE_SCOPE, setting, newValue);
    } else {
      if (!ImpulseCounterApp.#hasActiveGM()) {
        ui.notifications.warn(game.i18n.localize("IMPULSO.ImpulseCounter.NoGM"));
        return;
      }
      game.socket.emit("system.impulso", {
        action: "sharedCounter",
        setting,
        operation: delta > 0 ? "increment" : "decrement"
      });
    }
  }

  static async #onIncrementImpulse() { await ImpulseCounterApp.#onModify("impulseCounter", 1); }
  static async #onDecrementImpulse() { await ImpulseCounterApp.#onModify("impulseCounter", -1); }
  static async #onIncrementConsequence() { await ImpulseCounterApp.#onModify("consequenceCounter", 1); }
  static async #onDecrementConsequence() { await ImpulseCounterApp.#onModify("consequenceCounter", -1); }

  // ─── Helpers ───────────────────────────────────────────────

  static #hasActiveGM() {
    return game.users.some(u => u.isGM && u.active);
  }
}

/**
 * Determine if this client is the primary GM (lowest ID among active GMs).
 * @returns {boolean}
 */
export function isPrimaryGM() {
  if (!game.user.isGM) return false;
  const activeGMs = game.users.filter(u => u.isGM && u.active);
  activeGMs.sort((a, b) => a.id.localeCompare(b.id));
  return activeGMs[0]?.id === game.user.id;
}

/**
 * Handle socket messages for shared counters.
 * Only the primary GM should call this.
 * @param {object} data - Socket payload
 */
export function handleImpulseCounterSocket(data) {
  const validSettings = ["impulseCounter", "consequenceCounter"];
  const setting = data.setting ?? (data.action === "impulseCounter" ? "impulseCounter" : null);
  if (!setting || !validSettings.includes(setting)) return;

  const current = game.settings.get(IMPULSO_MODULE_SCOPE, setting);
  let newValue = current;

  switch (data.operation) {
    case "increment":
      newValue = current + 1;
      break;
    case "decrement":
      newValue = Math.max(0, current - 1);
      break;
    case "set":
      newValue = Math.max(0, parseInt(data.value) || 0);
      break;
  }

  if (newValue !== current) {
    game.settings.set(IMPULSO_MODULE_SCOPE, setting, newValue);
  }
}
