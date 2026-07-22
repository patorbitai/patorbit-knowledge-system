import { Module } from "@nestjs/common";
import { DatabaseModule } from "@patorbit/database";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceController } from "./workspace.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
