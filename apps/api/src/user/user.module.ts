// apps/api/src/user/user.module.ts
import { Module } from "@nestjs/common";

import { IdentityModule } from "../identity/identity.module";
import { UserController } from "./user.controller";

@Module({
  imports: [IdentityModule],
  controllers: [UserController],
})
export class UserModule {}
