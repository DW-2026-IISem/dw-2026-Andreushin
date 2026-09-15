import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CircularGuajira — API de Negocio')
    .setDescription(
      'API REST del backend de negocio de CircularGuajira: recicladores, materiales, tarifas de material y liquidaciones de pesaje.',
    )
    .setVersion('1.0')
    .addTag('Recyclers', 'Recicladores u organizaciones recolectoras')
    .addTag('Materials', 'Catálogo de materiales reciclables')
    .addTag('MaterialRates', 'Tarifas por kilogramo y stock acumulado por material')
    .addTag('Settlements', 'Liquidaciones de pesaje y pago a recicladores')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3002);
}

bootstrap().catch((error: unknown) => {
  // Fail-Fast: mensaje claro y salida inmediata si el arranque falla
  // (p. ej. variables de entorno inválidas o base de datos inalcanzable).
  console.error('[Bootstrap] Error fatal al iniciar la aplicación');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
