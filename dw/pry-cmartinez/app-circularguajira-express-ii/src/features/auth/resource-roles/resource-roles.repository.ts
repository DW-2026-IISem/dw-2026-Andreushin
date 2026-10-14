import { Transaction } from "sequelize";
import { ResourceRole } from "./resource-role.model";
import { Role } from "../roles/role.model";
import { Resource } from "../resources/resource.model";
import { ResourceRoleFilters } from "./dto/resource-role.dto";

// Summary of the role and of the resource: (method, path) is what authorize evaluates.
const SUMMARIES = [
  { model: Role, as: "role", attributes: ["id", "name"] },
  { model: Resource, as: "resource", attributes: ["id", "method", "path", "description"] },
];

export class ResourceRolesRepository {
  // ================== READ ==================

  findAllActive(filters: ResourceRoleFilters): Promise<ResourceRole[]> {
    return ResourceRole.findAll({
      where: {
        status: "active",
        ...(filters.roleId === undefined ? {} : { roleId: filters.roleId }),
        ...(filters.resourceId === undefined ? {} : { resourceId: filters.resourceId }),
      },
      include: SUMMARIES,
      order: [["id", "ASC"]],
    });
  }

  findById(id: number): Promise<ResourceRole | null> {
    return ResourceRole.findByPk(id, { include: SUMMARIES });
  }

  // Any status: enables create-or-reactivate on the unique (role_id, resource_id) pair.
  findByRoleAndResource(roleId: number, resourceId: number): Promise<ResourceRole | null> {
    return ResourceRole.findOne({ where: { roleId, resourceId } });
  }

  // Every grant of a role (active and inactive), locked for a reconciliation.
  findAllByRole(roleId: number, transaction: Transaction): Promise<ResourceRole[]> {
    return ResourceRole.findAll({ where: { roleId }, transaction, lock: transaction.LOCK.UPDATE });
  }

  // ================== CREATE ==================

  create(roleId: number, resourceId: number, transaction?: Transaction): Promise<ResourceRole> {
    return ResourceRole.create({ roleId, resourceId, status: "active" }, { transaction });
  }

  // ================== UPDATE ==================

  setStatus(grant: ResourceRole, status: "active" | "inactive", transaction?: Transaction): Promise<ResourceRole> {
    return grant.update({ status }, { transaction });
  }
}
