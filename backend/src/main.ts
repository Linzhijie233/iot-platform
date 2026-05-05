import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('IoT Platform API')
    .setDescription('后端 HTTP API')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, '本地开发')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // 与 app.setGlobalPrefix('api') 对齐；默认仅挂载在 /docs，会 404 /api/docs
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  await app.listen(port);
}
void bootstrap();
