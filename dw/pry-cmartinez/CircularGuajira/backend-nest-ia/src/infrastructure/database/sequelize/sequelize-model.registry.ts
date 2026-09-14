import type { ModelCtor } from 'sequelize-typescript';

const registeredModels: ModelCtor[] = [];

/**
 * Registro global de modelos Sequelize. Cada feature de negocio invoca esta
 * función al definir su `.model.ts` (side-effect en el import) para que la
 * fábrica de conexión (`sequelize.factory.ts`) los incluya al construir la
 * instancia única de Sequelize, antes de la sincronización inicial.
 */
export function registerSequelizeModel(model: ModelCtor): void {
  if (!registeredModels.includes(model)) {
    registeredModels.push(model);
  }
}

export function getRegisteredSequelizeModels(): ModelCtor[] {
  return [...registeredModels];
}
