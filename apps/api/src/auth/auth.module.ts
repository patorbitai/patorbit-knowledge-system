// apps/api/src/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { IdentityModule } from "../identity/identity.module";
import { SessionModule } from "../session/session.module";
import { AuditModule } from "../audit/audit.module";
import { TokenService } from "./token.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    IdentityModule,
    SessionModule,
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
