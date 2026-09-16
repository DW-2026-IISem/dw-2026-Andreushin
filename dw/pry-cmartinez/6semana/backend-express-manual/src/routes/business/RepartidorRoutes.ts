import { Router } from "express";
import { RepartidorController } from "../../controllers/business/RepartidorController";

const router = Router();

router.post("/", RepartidorController.create);
router.get("/", RepartidorController.findAll);
router.get("/:id", RepartidorController.findOne);
router.put("/:id", RepartidorController.update);
router.delete("/:id", RepartidorController.remove);

export default router;
