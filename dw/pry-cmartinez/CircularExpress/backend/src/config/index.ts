import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import { getDatabaseInfo, testConnection } from "../database/db";

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
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', service: 'circularguajira-api', timestamp: new Date().toISOString() });
    });
    // ISS-03 §4.3
  }

  private async dbConnection(): Promise<void> {
    try {
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Intentando conectar a: ${dbInfo.connectionString}`);
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error(`No se pudo conectar a la base de datos ${dbInfo.engine.toUpperCase()}`);
      }
      // ISS-03: registro de modelos y sequelize.sync()
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1);
    }
  }

  async listen() {
    await this.app.listen(this.app.get('port'));
    console.log(`🚀 Servidor CircularGuajira ejecutándose en puerto ${this.app.get('port')}`);
  }
}
