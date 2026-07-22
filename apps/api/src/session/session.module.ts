// apps/api/src/session/session.module.ts
import { Module } from "@nestjs/common";
import { DatabaseModule } from "@patorbit/database";

import { IdentityModule } from "../identity/identity.module";
import { SessionService } from "./session.service";

@Module({
  imports: [DatabaseModule, IdentityModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
