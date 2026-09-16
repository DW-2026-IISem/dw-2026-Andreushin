import { Request, Response } from "express";
import { UniqueConstraintError, ValidationError } from "sequelize";
import { Client } from "../../models/business/Client";

export const ClientController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tipo_documento, numero_documento, nombre, telefono, email } = req.body;

      if (!tipo_documento || !numero_documento || !nombre) {
        res.status(400).json({ message: "tipo_documento, numero_documento y nombre son obligatorios" });
        return;
      }

      const client = await Client.create({
        tipo_documento,
        numero_documento,
        nombre,
        telefono: telefono ?? null,
        email: email ?? null,
      });

      res.status(201).json(client);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        res.status(409).json({ message: "Ya existe un cliente con ese numero_documento" });
        return;
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al crear el cliente" });
    }
  },

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const { is_active } = req.query;

      const clients = await Client.findAll(
        is_active !== undefined ? { where: { is_active: is_active === "true" } } : {}
      );
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error al listar los clientes" });
    }
  },

  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const client = await Client.findByPk(String(req.params.id));

      if (!client) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }

      res.status(200).json(client);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el cliente" });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const client = await Client.findByPk(String(req.params.id));

      if (!client) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }

      const { tipo_documento, numero_documento, nombre, telefono, email, is_active } = req.body;

      await client.update({
        ...(tipo_documento !== undefined && { tipo_documento }),
        ...(numero_documento !== undefined && { numero_documento }),
        ...(nombre !== undefined && { nombre }),
        ...(telefono !== undefined && { telefono }),
        ...(email !== undefined && { email }),
        ...(is_active !== undefined && { is_active }),
      });

      res.status(200).json(client);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        res.status(409).json({ message: "Ya existe un cliente con ese numero_documento" });
        return;
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Error al actualizar el cliente" });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const client = await Client.findByPk(String(req.params.id));

      if (!client) {
        res.status(404).json({ message: "Cliente no encontrado" });
        return;
      }

      await client.update({ is_active: false });
      res.status(200).json({ message: "Cliente desactivado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error al desactivar el cliente" });
    }
  },
};
