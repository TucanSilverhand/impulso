import { IMPULSO_SYSTEM_ID, registerSystemSettings } from "./module/config/index.mjs";
import { registerDocuments } from "./module/documents/index.mjs";
import { registerSheets } from "./module/sheets/index.mjs";
import { registerDataModels } from "./module/data/index.mjs";
import { ImpulseCounterApp, isPrimaryGM, handleImpulseCounterSocket } from "./module/apps/impulse-counter.mjs";
import { migrateWorld } from "./module/migrations.mjs";

Hooks.once("init", () => {
  console.info(`Impulso | Initializing system ${IMPULSO_SYSTEM_ID}`);

  game.impulso ??= {};

  registerSystemSettings();
  registerDocuments();
  registerSheets();
  registerDataModels();
});

Hooks.once("ready", async () => {
  console.info("Impulso | System ready");

  await migrateWorld();

  // Shared impulse counter panel
  const counter = new ImpulseCounterApp();
  game.impulso.impulseCounter = counter;
  counter.render(true);

  // Socket listener — only the primary GM processes player requests
  game.socket.on("system.impulso", (data) => {
    if (isPrimaryGM()) {
      handleImpulseCounterSocket(data);
    }
  });
});

Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addColorset({
    name: "impulso-red",
    description: "Impulso · Rojo",
    category: "Impulso",
    foreground: "#ffffff",
    background: "#a33730",
    outline: "#5a1212",
    edge: "#5a1212",
    texture: "none",
    material: "plastic",
    font: "Arial"
  }, "default");

  dice3d.addColorset({
    name: "impulso-black",
    description: "Impulso · Negro",
    category: "Impulso",
    foreground: "#eeeeee",
    background: "#1a1a1a",
    outline: "#555555",
    edge: "#555555",
    texture: "none",
    material: "plastic",
    font: "Arial"
  }, "default");
});
