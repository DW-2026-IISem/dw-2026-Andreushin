import { Request, Response } from "express";
import { ValidationError } from "sequelize";
import { Repartidor } from "../../models/business/Repartidor";

export const RepartidorController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        res.status(400).json({ message: "nombre es obligatorio" });
        return;
      }

      const repartidor = await Repartidor.create({
        nombre,
        descripcion: descripcion ?? null,
      });

      res.status(201).json(repartidor);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al crear el repartidor" });
    }
  },

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const { is_active } = req.query;

      const repartidores = await Repartidor.findAll(
        is_active !== undefined ? { where: { is_active: is_active === "true" } } : {}
      );
      res.status(200).json(repartidores);
    } catch (error) {
      res.status(500).json({ message: "Error al listar los repartidores" });
    }
  },

  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const repartidor = await Repartidor.findByPk(String(req.params.id));

      if (!repartidor) {
        res.status(404).json({ message: "Repartidor no encontrado" });
        return;
      }

      res.status(200).json(repartidor);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el repartidor" });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const repartidor = await Repartidor.findByPk(String(req.params.id));

      if (!repartidor) {
        res.status(404).json({ message: "Repartidor no encontrado" });
        return;
      }

      const { nombre, descripcion, is_active } = req.body;

      await repartidor.update({
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(is_active !== undefined && { is_active }),
      });

      res.status(200).json(repartidor);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al actualizar el repartidor" });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const repartidor = await Repartidor.findByPk(String(req.params.id));

      if (!repartidor) {
        res.status(404).json({ message: "Repartidor no encontrado" });
        return;
      }

      await repartidor.update({ is_active: false });
      res.status(200).json({ message: "Repartidor desactivado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al desactivar el repartidor" });
    }
  },
};
