import { PlantStatus } from "../plant.model";

export interface CreatePlantDto {
  name: string;
  municipality: string;
  address?: string | null;
  description?: string | null;
  status?: PlantStatus;
}
