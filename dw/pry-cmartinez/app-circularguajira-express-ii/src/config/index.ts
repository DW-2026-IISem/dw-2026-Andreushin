import dotenv from "dotenv";
import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import { Routes } from "../routes/index";
import { sequelize, testConnection } from "../database/db";
// Models must be loaded before sequelize.sync().
import "../features/business/collectors/recycler.model";

dotenv.config();

export class App {
  public app: Application;
  public routePrv: Routes = new Routes();

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
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
  }

  private async dbConnection(): Promise<void> {
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Database connection failed");
    }
    await sequelize.sync();
    console.log("✅ Database synchronized");
  }

  async listen() {
    await this.dbConnection();
    this.app.listen(this.app.get("port"));
    console.log(`🚀 Servidor ejecutándose en puerto ${this.app.get("port")}`);
  }
}
