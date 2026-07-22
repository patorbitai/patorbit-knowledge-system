// apps/api/src/auth/strategies/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { type JwtPayload } from "@patorbit/auth";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        "JWT_ACCESS_SECRET",
        "default_access_secret"
      ),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== "access") {
      return null;
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
