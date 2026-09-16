import { Router } from "express";
import { ClientController } from "../../controllers/business/ClientController";

const router = Router();

router.post("/", ClientController.create);
router.get("/", ClientController.findAll);
router.get("/:id", ClientController.findOne);
router.put("/:id", ClientController.update);
router.delete("/:id", ClientController.remove);

export default router;
