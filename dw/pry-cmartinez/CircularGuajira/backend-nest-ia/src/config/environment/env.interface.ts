import type { Dialect, NodeEnv } from './env.validation.js';

export interface DatabaseEnv {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

export interface AppEnv {
  port: number;
  nodeEnv: NodeEnv;
  dbDialect: Dialect;
  database: DatabaseEnv;
}
