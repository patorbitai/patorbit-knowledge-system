import { Module } from "@nestjs/common";
import { DatabaseModule } from "@patorbit/database";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}