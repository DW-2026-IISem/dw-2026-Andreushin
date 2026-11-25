import { Resource, ResourceCreationAttributes } from "./resource.model";
import { ResourcePatchDto } from "./dto/resource.dto";

export class ResourcesRepository {
  // ================== READ ==================

  findAllActive(): Promise<Resource[]> {
    return Resource.findAll({
      where: { status: "active" },
      order: [
        ["path", "ASC"],
        ["method", "ASC"],
      ],
    });
  }

  findById(id: number): Promise<Resource | null> {
    return Resource.findByPk(id);
  }

  // The subset of `ids` that exists AND is active (to validate a whole matrix in one query).
  findActiveByIds(ids: readonly number[]): Promise<Resource[]> {
    return Resource.findAll({ where: { id: [...ids], status: "active" } });
  }

  // Any status: the (method, path) pair is unique in the table.
  findByOperation(method: string, path: string): Promise<Resource | null> {
    return Resource.findOne({ where: { method, path } });
  }

  // ================== CREATE ==================

  create(data: ResourceCreationAttributes): Promise<Resource> {
    return Resource.create(data);
  }

  // ================== UPDATE ==================

  update(resource: Resource, data: ResourcePatchDto | { status: "inactive" }): Promise<Resource> {
    return resource.update(data);
  }

  // ================== DELETE ==================

  delete(resource: Resource): Promise<void> {
    return resource.destroy();
  }
}
