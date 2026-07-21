import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableCors();

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  console.log(`API service is running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start API service", err);
  process.exit(1);
});
