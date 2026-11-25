import { Op } from "sequelize";
import { User, UserCreationAttributes } from "./user.model";
import { UserPatchDto } from "./dto/user.dto";

// API reads never project the hash; only the two `...WithPassword` reads do, by name.
const WITHOUT_PASSWORD = { exclude: ["password"] };

export class UsersRepository {
  // ================== READ ==================

  findAllActive(): Promise<User[]> {
    return User.findAll({ where: { status: "active" }, attributes: WITHOUT_PASSWORD, order: [["username", "ASC"]] });
  }

  findById(id: number): Promise<User | null> {
    return User.findByPk(id, { attributes: WITHOUT_PASSWORD });
  }

  // Only for the password change (verifies the current credential).
  findByIdWithPassword(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  // Only for the login (ISS-15): username or email in one field.
  findByIdentifierWithPassword(identifier: string): Promise<User | null> {
    const value = identifier.trim().toLowerCase();
    return User.findOne({ where: { [Op.or]: [{ username: value }, { email: value }] } });
  }

  // Any status: username and email stay unique even for inactive users.
  findConflicts(username: string, email: string): Promise<User[]> {
    return User.findAll({
      where: { [Op.or]: [{ username }, { email }] },
      attributes: ["id", "username", "email"],
    });
  }

  // ================== CREATE ==================

  // The model hook hashes the password.
  create(data: UserCreationAttributes): Promise<User> {
    return User.create(data);
  }

  // ================== UPDATE ==================

  update(user: User, data: UserPatchDto | { password: string } | { status: "inactive" }): Promise<User> {
    return user.update(data);
  }

  // ================== DELETE ==================

  delete(user: User): Promise<void> {
    return user.destroy();
  }
}
