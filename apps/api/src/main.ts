import "reflect-metadata";
import path from "node:path";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const webOrigin = config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";

  app.setGlobalPrefix("api");
  app.useStaticAssets(path.join(__dirname, "..", "..", "uploads"), { prefix: "/uploads/" });
  app.use(cookieParser());
  app.enableCors({
    origin: webOrigin,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  const port = Number(process.env.PORT ?? config.get<string>("API_PORT") ?? 4000);
  console.log(`[Bootstrap] PORT env=${process.env.PORT} → listening on ${port}`);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
