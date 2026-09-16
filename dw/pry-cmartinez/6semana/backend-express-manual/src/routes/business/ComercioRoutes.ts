import { Router } from "express";
import { ComercioController } from "../../controllers/business/ComercioController";

const router = Router();

router.post("/", ComercioController.create);
router.get("/", ComercioController.findAll);
router.get("/:id", ComercioController.findOne);
router.put("/:id", ComercioController.update);
router.delete("/:id", ComercioController.remove);

export default router;
