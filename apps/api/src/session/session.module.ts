// apps/api/src/session/session.module.ts
import { Module } from "@nestjs/common";
import { SessionService } from "./session.service";
import { DatabaseModule } from "@patorbit/database";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [DatabaseModule, IdentityModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
