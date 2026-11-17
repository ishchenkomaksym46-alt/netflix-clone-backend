import {PrismaService} from "../prisma.service";
import {AdminService} from "./admin.service";
import {Module} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import {AdminController} from "./admin.controller";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}