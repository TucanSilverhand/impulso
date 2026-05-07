import { IMPULSO_MODULE_SCOPE } from "./config/constants.mjs";

const CURRENT_MIGRATION_VERSION = "0.2.0";

const RETIRED_ITEM_TYPES = new Set(["talent", "gear", "power"]);

const MIGRATIONS = [
  { version: "0.1.0", actor: migrateActor_0_1_0 },
  { version: "0.2.0", actor: migrateActor_0_2_0, world: migrateWorld_0_2_0 }
];

const ESTADO_BIT_MAP = {
  1:  "rasguno1",
  2:  "rasguno2",
  4:  "herida",
  8:  "heridaGrave",
  16: "moribundo"
};

function migrateActor_0_1_0(actor) {
  const updates = {};
  const system = actor.system ?? {};

  const estado = system.estado;
  if (typeof estado === "number") {
    const states = [];
    for (const [bit, id] of Object.entries(ESTADO_BIT_MAP)) {
      if (estado & Number(bit)) states.push(id);
    }
    updates["system.estado"] = states;
  }

  if (system.traits !== undefined) updates["system.-=traits"] = null;
  if (system.biography !== undefined) updates["system.-=biography"] = null;

  return updates;
}

function migrateActor_0_2_0(actor) {
  return null;
}

async function migrateWorld_0_2_0() {
  const orphans = game.items.filter(i => RETIRED_ITEM_TYPES.has(i.type));
  if (orphans.length > 0) {
    await Item.deleteDocuments(orphans.map(i => i.id));
  }

  for (const actor of game.actors) {
    const owned = actor.items.filter(i => RETIRED_ITEM_TYPES.has(i.type));
    if (owned.length > 0) {
      await actor.deleteEmbeddedDocuments("Item", owned.map(i => i.id));
    }
  }
}

async function applyMigration({ actor: actorMigrate, world: worldMigrate }) {
  if (actorMigrate) {
    for (const actor of game.actors) {
      try {
        const updates = actorMigrate(actor);
        if (updates && !foundry.utils.isEmpty(updates)) {
          await actor.update(updates, { diff: false, render: false });
        }
      } catch (err) {
        console.error(`Impulso | Migration failed for actor ${actor.name}:`, err);
      }
    }

    for (const scene of game.scenes) {
      for (const token of scene.tokens) {
        if (token.actorLink || !token.actor) continue;
        try {
          const updates = actorMigrate(token.actor);
          if (updates && !foundry.utils.isEmpty(updates)) {
            await token.actor.update(updates, { diff: false, render: false });
          }
        } catch (err) {
          console.error(`Impulso | Migration failed for token actor ${token.name}:`, err);
        }
      }
    }
  }

  if (worldMigrate) {
    try {
      await worldMigrate();
    } catch (err) {
      console.error(`Impulso | World migration failed:`, err);
    }
  }
}

export async function migrateWorld() {
  if (!game.user.isGM) return;

  const lastVersion = game.settings.get(IMPULSO_MODULE_SCOPE, "systemMigrationVersion") || "0.0.0";
  if (!foundry.utils.isNewerVersion(CURRENT_MIGRATION_VERSION, lastVersion)) return;

  ui.notifications.info(`Impulso | Migrando datos del mundo (${lastVersion} → ${CURRENT_MIGRATION_VERSION})…`);

  for (const migration of MIGRATIONS) {
    if (foundry.utils.isNewerVersion(migration.version, lastVersion)) {
      await applyMigration(migration);
    }
  }

  await game.settings.set(IMPULSO_MODULE_SCOPE, "systemMigrationVersion", CURRENT_MIGRATION_VERSION);
  ui.notifications.info(`Impulso | Migración completada.`);
}
