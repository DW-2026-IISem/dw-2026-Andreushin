import { WeighingStatus } from "../weighing.model";

// netWeightKg is not accepted: the server computes gross - tare.
export interface CreateWeighingDto {
  name: string;
  collectionId: number;
  materialId: number;
  grossWeightKg: number;
  tareWeightKg?: number; // defaults to 0
  materialLotId?: number | null;
  description?: string | null;
  status?: WeighingStatus;
}
