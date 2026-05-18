import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for the bundled frontend (and any other origin in dev).
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global pipes — DTO validation + payload transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Consistent error envelope across the API
  app.useGlobalFilters(new HttpExceptionFilter());

  // Versionless prefix keeps routes tidy and ready for future /v2
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Leads API')
    .setDescription('Manage marketing leads and generate AI-powered summaries')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Leads API listening on http://localhost:${port} — docs at /docs`);
}

void bootstrap();
