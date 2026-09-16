// Script de seed en JS puro: usa ts-node/register para poder importar
// directamente los modelos de Sequelize escritos en TypeScript.
require("ts-node/register");
require("dotenv").config();

const { faker } = require("@faker-js/faker");
const { getSequelize } = require("../database");
const { Client } = require("../models/business/Client");
const { Comercio } = require("../models/business/Comercio");
const { Repartidor } = require("../models/business/Repartidor");
const { Producto } = require("../models/business/Producto");

const TOTAL = Number(process.env.SEED_TOTAL) || 10;

async function seed() {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  await sequelize.sync();

  console.log(`Sembrando ${TOTAL} registros por entidad...`);

  const clientes = await Client.bulkCreate(
    Array.from({ length: TOTAL }, () => ({
      tipo_documento: faker.helpers.arrayElement(["CC", "CE", "NIT"]),
      numero_documento: faker.string.numeric(10),
      nombre: faker.person.fullName(),
      telefono: faker.string.numeric(10), // telefono es VARCHAR(20); el formato libre de faker.phone.number() se pasaba de largo
      email: faker.internet.email(),
    }))
  );

  const comercios = await Comercio.bulkCreate(
    Array.from({ length: TOTAL }, () => ({
      nombre: faker.company.name(),
      descripcion: faker.company.catchPhrase(),
    }))
  );

  const repartidores = await Repartidor.bulkCreate(
    Array.from({ length: TOTAL }, () => ({
      nombre: faker.person.fullName(),
      descripcion: faker.vehicle.vehicle(),
    }))
  );

  const productos = await Producto.bulkCreate(
    Array.from({ length: TOTAL }, () => ({
      comercio_id: faker.helpers.arrayElement(comercios).id,
      sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      // Number(): faker.commerce.price() devuelve string; Oracle (node-oracledb)
      // rechaza el bind de un string contra una columna DECIMAL (NJS-011),
      // mientras que MySQL/Postgres/MSSQL lo castean sin problema.
      precio: Number(faker.commerce.price({ min: 5000, max: 150000 })),
    }))
  );

  console.log(
    `✅ Listo: ${clientes.length} clientes, ${comercios.length} comercios, ` +
      `${repartidores.length} repartidores, ${productos.length} productos.`
  );

  await sequelize.close();
}

seed().catch((error) => {
  console.error("❌ Error al sembrar la base de datos:", error);
  process.exit(1);
});
