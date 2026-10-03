import { CreatePlantDto } from "./create-plant.dto";

// PUT replaces the whole resource: omitted optional fields are cleared to null.
export type UpdatePlantDto = CreatePlantDto;
