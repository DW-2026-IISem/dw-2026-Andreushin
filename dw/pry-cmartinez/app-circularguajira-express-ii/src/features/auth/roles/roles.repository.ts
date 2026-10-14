import { Role, RoleCreationAttributes } from "./role.model";
import { RolePatchDto } from "./dto/role.dto";

export class RolesRepository {
  // ================== READ ==================

  findAllActive(): Promise<Role[]> {
    return Role.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
  }

  findById(id: number): Promise<Role | null> {
    return Role.findByPk(id);
  }

  // Any status: names stay unique even for inactive roles.
  findByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name: name.trim().toUpperCase() } });
  }

  // ================== CREATE ==================

  create(data: RoleCreationAttributes): Promise<Role> {
    return Role.create(data);
  }

  // ================== UPDATE ==================

  update(role: Role, data: RolePatchDto | { status: "inactive" }): Promise<Role> {
    return role.update(data);
  }

  // ================== DELETE ==================

  delete(role: Role): Promise<void> {
    return role.destroy();
  }
}
