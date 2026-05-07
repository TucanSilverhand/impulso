import { ImpulsoActor } from "./impulso-actor.mjs";
import { ImpulsoItem } from "./impulso-item.mjs";

export function registerDocuments() {
  CONFIG.Actor.documentClass = ImpulsoActor;
  CONFIG.Item.documentClass = ImpulsoItem;
}

export { ImpulsoActor, ImpulsoItem };
