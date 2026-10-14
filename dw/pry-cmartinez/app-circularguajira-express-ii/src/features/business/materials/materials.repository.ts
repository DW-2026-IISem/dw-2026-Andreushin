import { Material, MaterialCreationAttributes } from "./material.model";
import { MaterialPatchDto } from "./dto/material.dto";

export class MaterialsRepository {
  // ================== READ ==================

  findAllActive(): Promise<Material[]> {
    return Material.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
  }

  findById(id: number): Promise<Material | null> {
    return Material.findByPk(id);
  }

  // Any status: names stay unique even for inactive materials.
  findByName(name: string): Promise<Material | null> {
    return Material.findOne({ where: { name } });
  }

  // ================== CREATE ==================

  create(data: MaterialCreationAttributes): Promise<Material> {
    return Material.create(data);
  }

  // ================== UPDATE ==================

  update(material: Material, data: MaterialPatchDto | { status: "inactive" }): Promise<Material> {
    return material.update(data);
  }

  // ================== DELETE ==================

  delete(material: Material): Promise<void> {
    return material.destroy();
  }
}
