import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import { getDatabaseInfo, syncDatabase, testConnection } from "../database/db";
import "../features/business/recyclers/recycler.model";
import "../features/business/routes/route.model";
import { Routes } from "../routes/index";
import { setupSwagger } from "../swagger/index";

dotenv.config();

export class App {
  public app: Application;
  public routePrv: Routes = new Routes();

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
    this.routePrv.recyclersRoutes.routes(this.app);
    this.routePrv.routesRoutes.routes(this.app);
    setupSwagger(this.app);
  }

  private async dbConnection(): Promise<void> {
    try {
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Connecting to: ${dbInfo.connectionString}`);
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error(`Could not connect to the ${dbInfo.engine.toUpperCase()} database`);
      }
      await syncDatabase();
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      process.exit(1);
    }
  }

  async listen() {
    await this.app.listen(this.app.get('port'));
    console.log(`🚀 CircularGuajira server running on port ${this.app.get('port')}`);
  }
}
