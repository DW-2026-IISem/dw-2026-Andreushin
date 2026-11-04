import { Recycler } from "../../business/collectors/recycler.model";
import { Material } from "../../business/materials/material.model";
import { Route } from "../../business/routes/route.model";
import { CollectionPoint } from "../../business/routes/collection-point.model";
import { Collection } from "../../business/weighing/collection.model";
import { Weighing } from "../../business/weighing/weighing.model";
import { Settlement } from "../../business/settlements/settlement.model";
import { User } from "../users/user.model";
import { Role } from "../roles/role.model";
import { Resource } from "../resources/resource.model";
import { RoleUser } from "../role-users/role-user.model";
import { ResourceRole } from "../resource-roles/resource-role.model";

/**
 * Every row of a table, whatever its status. The feature lists stay active-only because
 * forms and business rules depend on them. These reads carry the same projections and
 * order as those lists; the user password is never projected.
 */
export class ArchiveRepository {
  recyclers = () => Recycler.findAll({ order: [["id", "ASC"]] });
  materials = () => Material.findAll({ order: [["name", "ASC"]] });
  routes = () => Route.findAll({ order: [["name", "ASC"]] });
  collectionPoints = () =>
    CollectionPoint.findAll({ order: [["routeId", "ASC"], ["visitOrder", "ASC"]] });
  collections = () =>
    Collection.findAll({
      include: [{ model: Weighing, as: "weighings", required: false }],
      order: [
        ["collectedOn", "DESC"],
        ["id", "DESC"],
        [{ model: Weighing, as: "weighings" }, "id", "ASC"],
      ],
    });
  weighings = () => Weighing.findAll({ order: [["id", "ASC"]] });
  settlements = () => Settlement.findAll({ order: [["id", "DESC"]] });
  users = () => User.findAll({ attributes: { exclude: ["password"] }, order: [["username", "ASC"]] });
  roles = () => Role.findAll({ order: [["name", "ASC"]] });
  resources = () => Resource.findAll({ order: [["path", "ASC"], ["method", "ASC"]] });
  roleUsers = () =>
    RoleUser.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "username", "email"] },
        { model: Role, as: "role", attributes: ["id", "name"] },
      ],
      order: [["id", "ASC"]],
    });
  resourceRoles = () =>
    ResourceRole.findAll({
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        { model: Resource, as: "resource", attributes: ["id", "method", "path", "description"] },
      ],
      order: [["id", "ASC"]],
    });
}
