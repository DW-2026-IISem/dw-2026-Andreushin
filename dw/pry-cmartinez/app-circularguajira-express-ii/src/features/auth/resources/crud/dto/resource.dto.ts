import { ResourceStatus } from "../resource.model";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// POST /api/resources. The path is stored as a pattern (/api/collections/:id).
export interface ResourceCreateDto {
  method: HttpMethod;
  path: string;
  description: string | null;
  status?: ResourceStatus;
}

// PUT /api/resources/:id (full replacement). No status: it only changes via deactivate.
export interface ResourceUpdateDto {
  method: HttpMethod;
  path: string;
  description: string | null;
}

// PATCH /api/resources/:id.
export type ResourcePatchDto = Partial<ResourceUpdateDto>;
