import { RoleUser } from "./role-user.model";
import { User } from "../users/user.model";
import { Role } from "../roles/role.model";

// Summary of the user (never the password) and of the role.
const SUMMARIES = [
  { model: User, as: "user", attributes: ["id", "username", "email"] },
  { model: Role, as: "role", attributes: ["id", "name"] },
];

export class RoleUsersRepository {
  // ================== READ ==================

  findAllActive(): Promise<RoleUser[]> {
    return RoleUser.findAll({ where: { status: "active" }, include: SUMMARIES, order: [["id", "ASC"]] });
  }

  findById(id: number): Promise<RoleUser | null> {
    return RoleUser.findByPk(id, { include: SUMMARIES });
  }

  // Names of the active roles of a user through active assignments (session profile).
  async findActiveRoleNamesByUser(userId: number): Promise<string[]> {
    const roles = await Role.findAll({
      attributes: ["name"],
      where: { status: "active" },
      include: [{ model: RoleUser, as: "roleUsers", attributes: [], required: true, where: { userId, status: "active" } }],
      order: [["name", "ASC"]],
    });
    return roles.map((role) => role.name);
  }

  // Any status: enables create-or-reactivate on the unique (user_id, role_id) pair.
  findByUserAndRole(userId: number, roleId: number): Promise<RoleUser | null> {
    return RoleUser.findOne({ where: { userId, roleId } });
  }

  // ================== CREATE ==================

  create(userId: number, roleId: number): Promise<RoleUser> {
    return RoleUser.create({ userId, roleId, status: "active" });
  }

  // ================== UPDATE ==================

  setStatus(roleUser: RoleUser, status: "active" | "inactive"): Promise<RoleUser> {
    return roleUser.update({ status });
  }
}
