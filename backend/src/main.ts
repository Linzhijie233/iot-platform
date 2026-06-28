import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  // 允许前端直连（dev 代理之外的兜底，避免 CORS 拦截）
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 生产模式：同端口托管前端构建产物（frontend/dist 存在时启用）。
  // 这样前后端可由单个进程在同一个公网端口对外服务，无需 nginx / 额外端口。
  const frontendDist = join(__dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist);
    // SPA 深链接回退：非 /api 且非静态资源(无扩展名)的 GET 一律返回 index.html
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.includes('.')
      ) {
        res.sendFile(join(frontendDist, 'index.html'));
        return;
      }
      next();
    });
  }

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

  // 绑定 0.0.0.0，容器/云主机外部可访问
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
