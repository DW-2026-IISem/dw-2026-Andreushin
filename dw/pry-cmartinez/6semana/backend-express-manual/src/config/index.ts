import dotenv from "dotenv";
import express, { Application } from "express";
import morgan from "morgan";
import { connectDB } from "../database";
import clientRoutes from "../routes/business/ClientRoutes";
import comercioRoutes from "../routes/business/ComercioRoutes";
import repartidorRoutes from "../routes/business/RepartidorRoutes";
import productoRoutes from "../routes/business/ProductoRoutes";
var cors = require("cors");

dotenv.config();

export class App {
  public app: Application;

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
    this.dbConnection();
  }

  private settings(): void {
    this.app.set('port', this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan('dev'));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.get('/', (req, res) => {
      res.send('Corriendo en el puerto 4000');
    });

    this.app.use('/api/clients', clientRoutes);
    this.app.use('/api/comercios', comercioRoutes);
    this.app.use('/api/repartidores', repartidorRoutes);
    this.app.use('/api/productos', productoRoutes);
  }

  private async dbConnection(): Promise<void> {
    try {
      await connectDB();
    } catch (error) {
      console.error("❌ No fue posible conectar a la base de datos:", error);
      process.exit(1);
    }
  }

  async listen() {
    await this.app.listen(this.app.get('port'));
    console.log(`🚀 Servidor ejecutándose en puerto ${this.app.get('port')}`);
  }
}
