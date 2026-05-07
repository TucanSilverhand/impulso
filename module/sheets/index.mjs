import { ImpulsoActorSheet } from "./impulso-actor-sheet.mjs";
import { ImpulsoActorSheetNG } from "./impulso-actor-sheet-ng.mjs";
import { ImpulsoActorSheetLite } from "./impulso-actor-sheet-lite.mjs";
import { IMPULSO_MODULE_SCOPE } from "../config/constants.mjs";

const { Actors } = foundry.documents.collections;

export function registerSheets() {
  const style = game.settings.get(IMPULSO_MODULE_SCOPE, "sheetStyle");

  Actors.registerSheet("impulso", ImpulsoActorSheet, {
    makeDefault: style === "classic",
    label: "Clásico"
  });
  Actors.registerSheet("impulso", ImpulsoActorSheetNG, {
    makeDefault: style === "ng",
    label: "Nuevo"
  });
  Actors.registerSheet("impulso", ImpulsoActorSheetLite, {
    makeDefault: style === "lite",
    label: "Lite"
  });
}

export { ImpulsoActorSheet, ImpulsoActorSheetNG, ImpulsoActorSheetLite };
