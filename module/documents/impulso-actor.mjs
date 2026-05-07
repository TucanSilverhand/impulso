import { isDebugEnabled } from "../config/index.mjs";

export class ImpulsoActor extends Actor {
  async applyImpulseCost(cost = 1) {
    const current = this.system.resources.impulse.value ?? 0;
    const value = Math.max(0, current - Math.abs(cost));
    return this.update({ "system.resources.impulse.value": value });
  }

  async _preUpdate(changed, options, user) {
    if (isDebugEnabled() && changed.system) {
      const changedFields = this._getChangedFields(changed.system, this.system);
      if (changedFields.length > 0) {
        console.log(`[ImpulsoActor] Actualizando ${this.name}:`);
        changedFields.forEach(({ field, oldValue, newValue }) => {
          console.log(`  ${field}: ${oldValue} → ${newValue}`);
        });
      }
    }
    
    await super._preUpdate(changed, options, user);
  }

  _getChangedFields(changedSystem, currentSystem, prefix = '') {
    const changes = [];
    
    for (const [key, newValue] of Object.entries(changedSystem)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const oldValue = currentSystem?.[key];
      
      if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
        // Recursivo para objetos anidados
        changes.push(...this._getChangedFields(newValue, oldValue || {}, fullPath));
      } else if (oldValue !== newValue) {
        changes.push({
          field: fullPath,
          oldValue: oldValue ?? 'undefined',
          newValue: newValue ?? 'undefined'
        });
      }
    }
    
    return changes;
  }
}
