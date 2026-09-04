import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import type { Sequelize } from 'sequelize-typescript';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  @Get()
  async check() {
    const dialect = this.configService.get<string>('DB_DIALECT');

    let database: { status: string; dialect?: string } = { status: 'not_configured' };
    if (dialect) {
      try {
        await this.sequelize.authenticate();
        database = { status: 'connected', dialect };
      } catch {
        // Motor dockerizado aún no desplegado/alcanzable (S05) — no se cae el servidor por esto.
        database = { status: 'disconnected', dialect };
      }
    }

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
