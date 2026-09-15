/**
 * Entidad pura de dominio. Sin decoradores de Sequelize/NestJS ni
 * dependencias de framework: representa un tipo de material reciclable
 * aceptado en planta.
 */
export class MaterialEntity {
  constructor(
    public readonly id: number,
    public name: string,
    public description: string | null,
    public unitOfMeasure: string,
    public isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
