import { IMPULSO_MODULE_SCOPE } from "./constants.mjs";

/**
 * Register system-level settings to expose basic toggles during early development.
 */
export function registerSystemSettings() {
  game.settings.register(IMPULSO_MODULE_SCOPE, "enableAdvancedDice", {
    name: "Enable Advanced Dice",
    hint: "Toggle experimental dice features while the Impulso system is under active development.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "debugMode", {
    name: "Debug Mode",
    hint: "Enable debug logging to the browser console to track data changes and system operations.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "sheetStyle", {
    name: "Modo de juego",
    hint: "Selecciona el estilo de ficha de personaje para todos los jugadores.",
    scope: "world",
    config: true,
    type: String,
    default: "classic",
    choices: {
      classic: "Clásico",
      ng: "Nuevo",
      lite: "Lite"
    },
    onChange: async (value) => {
      const sheetClass = {
        ng: "impulso.ImpulsoActorSheetNG",
        lite: "impulso.ImpulsoActorSheetLite"
      }[value] ?? "impulso.ImpulsoActorSheet";

      // Close all open actor sheets first
      for (const app of foundry.applications.instances.values()) {
        if (app instanceof foundry.applications.sheets.ActorSheetV2) {
          await app.close({ force: true });
        }
      }

      // Update default sheet for all actor types
      const sheetDefaults = game.settings.get("core", "sheetClasses");
      sheetDefaults.Actor ??= {};
      for (const type of Object.keys(CONFIG.Actor.dataModels)) {
        sheetDefaults.Actor[type] = sheetClass;
      }
      await game.settings.set("core", "sheetClasses", sheetDefaults);

      // Update sheet class on all existing actors
      for (const actor of game.actors) {
        await actor.setFlag("core", "sheetClass", sheetClass);
      }
    }
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "enableCorruption", {
    name: "Corrupción",
    hint: "Activa el sistema de corrupción en las hojas de personaje.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      for (const app of foundry.applications.instances.values()) {
        if (app instanceof foundry.applications.sheets.ActorSheetV2) app.render();
      }
    }
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "impulseCounter", {
    name: "Shared Impulse Counter",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: () => game.impulso?.impulseCounter?.render()
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "consequenceCounter", {
    name: "Shared Consequence Counter",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: () => game.impulso?.impulseCounter?.render()
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "impulseCounterPosition", {
    scope: "client",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(IMPULSO_MODULE_SCOPE, "systemMigrationVersion", {
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });
}

/**
 * Check if debug mode is enabled
 * @returns {boolean} True if debug logging is enabled
 */
export function isDebugEnabled() {
  return game.settings.get(IMPULSO_MODULE_SCOPE, "debugMode");
}
