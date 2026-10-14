import { Request, Response } from "express";
import { RecyclersService } from "./recyclers.service";
import { handleError } from "../../../shared/http/handleError";

export class RecyclersController {
  constructor(private readonly recyclersService = new RecyclersService()) {}

  // ================== READ ==================

  // ================== CREATE ==================

  // ================== UPDATE ==================

  // ================== DELETE ==================
}
