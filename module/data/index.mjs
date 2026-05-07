import { registerActorDataModels } from "./actor-data-models.mjs";
import { registerItemDataModels } from "./item-data-models.mjs";

export function registerDataModels() {
  registerActorDataModels();
  registerItemDataModels();
}
