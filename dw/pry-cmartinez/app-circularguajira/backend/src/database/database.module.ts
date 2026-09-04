import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dialect = configService.get<string>('DB_DIALECT');
        const allowedDialects = ['mysql', 'postgres', 'sqlite', 'mariadb', 'mssql'];

        // Validar dinámicamente en tiempo de ejecución (M4 - Requisito de la Base Técnica)
        if (!dialect || !allowedDialects.includes(dialect.toLowerCase())) {
          throw new Error(
            `\n[DatabaseConfigError] El dialecto de base de datos '${dialect}' no es válido o está ausente en el archivo .env.\n` +
            `Dialectos soportados y permitidos: ${allowedDialects.join(', ')}\n` +
            `Por favor, verifica tu configuración de variables de entorno.`
          );
        }

        return {
          dialect: dialect.toLowerCase() as any,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 3306),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          // Sin modelos de negocio aún (Semana 05+), autoLoadModels queda en false para que
          // el arranque del servidor no dependa de que el motor dockerizado esté alcanzable.
          // El healthcheck (GET /api/health) hace su propio chequeo de conexión bajo demanda.
          autoLoadModels: false,
          synchronize: false,    // Deshabilitado en producción/desarrollo estructurado para usar migraciones/seeders
          retryAttempts: 0,      // Falla rápido en vez de reintentar ~27s si el motor no responde
          logging: configService.get<string>('NODE_ENV') === 'development' ? console.log : false,
          define: {
            underscored: true,  // Forzar snake_case para los nombres de campos en la base de datos física (ej. ruta_id)
            timestamps: true,   // Agregar automáticamente campos created_at y updated_at
          },
        };
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
