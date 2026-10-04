import dotenv from "dotenv";
import express, { Application, NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import { getDatabaseInfo, syncDatabase, testConnection } from "../database/db";
import "../database/models";
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
    this.docs();
    this.errorHandlers();
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
    this.routePrv.collectionPointsRoutes.routes(this.app);
    this.routePrv.collectionsRoutes.routes(this.app);
    this.routePrv.materialsRoutes.routes(this.app);
    this.routePrv.materialRatesRoutes.routes(this.app);
    this.routePrv.plantsRoutes.routes(this.app);
    this.routePrv.materialLotsRoutes.routes(this.app);
    this.routePrv.weighingsRoutes.routes(this.app);
    this.routePrv.materialSalesRoutes.routes(this.app);
    this.routePrv.settlementsRoutes.routes(this.app);
  }

  private docs(): void {
    setupSwagger(this.app);
  }

  // Registered last: JSON answers for unknown routes and for errors thrown before a controller runs
  // (e.g. malformed JSON bodies), instead of Express' default HTML pages.
  private errorHandlers(): void {
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Ruta no encontrada', details: { method: req.method, path: req.originalUrl } });
    });
    this.app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const parseError = error as { type?: string; status?: number };
      if (parseError?.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
        return;
      }
      if (parseError?.status && parseError.status >= 400 && parseError.status < 500) {
        res.status(parseError.status).json({ error: 'Petición inválida' });
        return;
      }
      console.error('Unhandled error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
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
