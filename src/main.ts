import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'netflix-clone-six-iota-71.vercel.app',
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(5000);
}
bootstrap();
