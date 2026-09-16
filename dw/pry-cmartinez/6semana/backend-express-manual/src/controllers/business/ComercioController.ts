import { Request, Response } from "express";
import { ValidationError } from "sequelize";
import { Comercio } from "../../models/business/Comercio";

export const ComercioController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        res.status(400).json({ message: "nombre es obligatorio" });
        return;
      }

      const comercio = await Comercio.create({
        nombre,
        descripcion: descripcion ?? null,
      });

      res.status(201).json(comercio);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al crear el comercio" });
    }
  },

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const { is_active } = req.query;

      const comercios = await Comercio.findAll(
        is_active !== undefined ? { where: { is_active: is_active === "true" } } : {}
      );
      res.status(200).json(comercios);
    } catch (error) {
      res.status(500).json({ message: "Error al listar los comercios" });
    }
  },

  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const comercio = await Comercio.findByPk(String(req.params.id));

      if (!comercio) {
        res.status(404).json({ message: "Comercio no encontrado" });
        return;
      }

      res.status(200).json(comercio);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el comercio" });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const comercio = await Comercio.findByPk(String(req.params.id));

      if (!comercio) {
        res.status(404).json({ message: "Comercio no encontrado" });
        return;
      }

      const { nombre, descripcion, is_active } = req.body;

      await comercio.update({
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(is_active !== undefined && { is_active }),
      });

      res.status(200).json(comercio);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al actualizar el comercio" });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const comercio = await Comercio.findByPk(String(req.params.id));

      if (!comercio) {
        res.status(404).json({ message: "Comercio no encontrado" });
        return;
      }

      await comercio.update({ is_active: false });
      res.status(200).json({ message: "Comercio desactivado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al desactivar el comercio" });
    }
  },
};
