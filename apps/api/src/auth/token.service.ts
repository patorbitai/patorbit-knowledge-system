// apps/api/src/auth/token.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { type JwtService } from "@nestjs/jwt";
import { type JwtPayload } from "@patorbit/auth";

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpires: string;
  private readonly refreshExpires: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.accessSecret = this.configService.get<string>(
      "JWT_ACCESS_SECRET",
      "default_access_secret"
    );
    this.refreshSecret = this.configService.get<string>(
      "JWT_REFRESH_SECRET",
      "default_refresh_secret"
    );
    this.accessExpires = this.configService.get<string>(
      "JWT_ACCESS_TOKEN_EXPIRATION",
      "15m"
    );
    this.refreshExpires = this.configService.get<string>(
      "JWT_REFRESH_TOKEN_EXPIRATION",
      "7d"
    );
  }

  async generateTokens(payload: Omit<JwtPayload, "type">) {
    const accessToken = this.jwtService.sign(
      { ...payload, type: "access" },
      { secret: this.accessSecret, expiresIn: this.accessExpires }
    );
    const refreshToken = this.jwtService.sign(
      { ...payload, type: "refresh" },
      { secret: this.refreshSecret, expiresIn: this.refreshExpires }
    );
    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret,
      });
      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }
      return payload;
    } catch (e) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
