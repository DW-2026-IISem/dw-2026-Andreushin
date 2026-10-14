import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
import cors from "cors";
import { Routes } from "../routes/index";
import { setupSwagger } from "../swagger/index";
import { testConnection } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
// Models and associations are registered for the ORM; the schema comes from migrations.
import "../features/business/collectors/recycler.model";
import "../features/business/materials/materials.associations";
import "../features/business/routes/routes.associations";
import "../features/business/weighing/weighing.associations";
import "../features/business/settlements/settlements.associations";
// Phase II: the RBAC associations file imports the six auth models first.
import "../features/auth/rbac.associations";

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
    this.errorHandling();
  }

  private settings(): void {
    this.app.set("port", this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan("dev"));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });
    this.routePrv.recyclersRoutes.routes(this.app);
    this.routePrv.materialsRoutes.routes(this.app);
    this.routePrv.routesRoutes.routes(this.app);
    this.routePrv.weighingRoutes.routes(this.app);
    this.routePrv.settlementsRoutes.routes(this.app);
    // Phase II: auth
    this.routePrv.usersRoutes.routes(this.app);
  }

  private docs(): void {
    setupSwagger(this.app);
  }

  /**
   * Errors raised before reaching a controller. A malformed JSON body makes
   * express.json() throw; without this handler Express answers with an HTML page that
   * includes the stack trace and server paths. Registered after the routes (4 arguments).
   */
  private errorHandling(): void {
    const bodyErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ message: "El cuerpo de la petición no es un JSON válido" });
        return;
      }
      next(err);
    };
    this.app.use(bodyErrorHandler);
  }

  private async dbConnection(): Promise<void> {
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Database connection failed");
    }
    await assertNoPendingMigrations();
    console.log("✅ Database schema up to date (migrations)");
  }

  async listen() {
    await this.dbConnection();
    this.app.listen(this.app.get("port"));
    console.log(`🚀 Servidor ejecutándose en puerto ${this.app.get("port")}`);
  }
}
