import { Router } from "express";
import { ProductoController } from "../../controllers/business/ProductoController";

const router = Router();

router.post("/", ProductoController.create);
router.get("/", ProductoController.findAll);
router.get("/:id", ProductoController.findOne);
router.put("/:id", ProductoController.update);
router.delete("/:id", ProductoController.remove);

export default router;
