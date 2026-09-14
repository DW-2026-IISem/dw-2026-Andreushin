/**
 * Entidad pura de dominio. Sin decoradores de Sequelize/NestJS ni
 * dependencias de framework: representa un reciclador u organización del
 * sistema de abastecimiento de recolección.
 */
export class RecyclerEntity {
  constructor(
    public readonly id: number,
    public documentNumber: string,
    public name: string,
    public phone: string | null,
    public email: string | null,
    public address: string | null,
    public isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
