import { Request, Response } from "express";
import { UniqueConstraintError, ValidationError } from "sequelize";
import { Producto } from "../../models/business/Producto";

export const ProductoController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { comercio_id, sku, nombre, descripcion, precio } = req.body;

      if (!comercio_id || !sku || !nombre || precio === undefined) {
        res.status(400).json({ message: "comercio_id, sku, nombre y precio son obligatorios" });
        return;
      }

      const producto = await Producto.create({
        comercio_id,
        sku,
        nombre,
        descripcion: descripcion ?? null,
        precio,
      });

      res.status(201).json(producto);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        res.status(409).json({ message: "Ya existe un producto con ese sku" });
        return;
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al crear el producto" });
    }
  },

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const { is_active, comercio_id } = req.query;

      const where: Record<string, unknown> = {};
      if (is_active !== undefined) where.is_active = is_active === "true";
      if (comercio_id !== undefined) where.comercio_id = comercio_id;

      const productos = await Producto.findAll({ where });
      res.status(200).json(productos);
    } catch (error) {
      res.status(500).json({ message: "Error al listar los productos" });
    }
  },

  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const producto = await Producto.findByPk(String(req.params.id));

      if (!producto) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }

      res.status(200).json(producto);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el producto" });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const producto = await Producto.findByPk(String(req.params.id));

      if (!producto) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }

      const { sku, nombre, descripcion, precio, is_active } = req.body;

      await producto.update({
        ...(sku !== undefined && { sku }),
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio }),
        ...(is_active !== undefined && { is_active }),
      });

      res.status(200).json(producto);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        res.status(409).json({ message: "Ya existe un producto con ese sku" });
        return;
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al actualizar el producto" });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const producto = await Producto.findByPk(String(req.params.id));

      if (!producto) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
      }

      await producto.update({ is_active: false });
      res.status(200).json({ message: "Producto desactivado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al desactivar el producto" });
    }
  },
};
