import { CreatePlantDto } from "./create-plant.dto";

// PATCH only touches the fields that are sent.
export type PatchPlantDto = Partial<CreatePlantDto>;
