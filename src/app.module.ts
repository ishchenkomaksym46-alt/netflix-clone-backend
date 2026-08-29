import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {PrismaService} from "./prisma.service";
import {JwtModule} from "@nestjs/jwt";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
