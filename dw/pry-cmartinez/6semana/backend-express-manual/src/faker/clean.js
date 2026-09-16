// Script inverso al seed: vacía las tablas de negocio (TRUNCATE) y
// reinicia los autoincrementales. Usa ts-node/register igual que seed.js
// para poder importar los modelos .ts directamente.
require("ts-node/register");
require("dotenv").config();

const { getSequelize } = require("../database");
const { Client } = require("../models/business/Client");
const { Comercio } = require("../models/business/Comercio");
const { Repartidor } = require("../models/business/Repartidor");
const { Producto } = require("../models/business/Producto");

async function clean() {
  const sequelize = getSequelize();
  await sequelize.authenticate();

  console.log("Limpiando la base de datos...");

  // Producto primero: es el que referencia a Comercio (comercio_id).
  const modelos = [Producto, Client, Comercio, Repartidor];

  for (const modelo of modelos) {
    await modelo.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  }

  console.log("✅ Base de datos limpia: clientes, comercios, repartidores y productos en 0.");

  await sequelize.close();
}

clean().catch((error) => {
  console.error("❌ Error al limpiar la base de datos:", error);
  process.exit(1);
});
