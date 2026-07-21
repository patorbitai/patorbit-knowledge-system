import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { AuthModule } from "./auth/auth.module";
import { IdentityModule } from "./identity/identity.module";
import { UserModule } from "./user/user.module";
import { ProfileModule } from "./profile/profile.module";
import { PermissionModule } from "./permission/permission.module";
import { SessionModule } from "./session/session.module";
import { AuditModule } from "./audit/audit.module";
import { OrganizationModule } from "./organization/organization.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { ClaimModule } from "./claim/claim.module";
import { EvidenceModule } from "./evidence/evidence.module";
import { CredentialModule } from "./credential/credential.module";
import { VerificationModule } from "./verification/verification.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { TrustModule } from "./trust/trust.module";
import { ConfidenceModule } from "./confidence/confidence.module";
import { TimelineModule } from "./timeline/timeline.module";
import { CareerPassportModule } from "./career-passport/career-passport.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CsrfController } from "./common/csrf.controller";
import { DatabaseModule } from "../../packages/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] }),
    DatabaseModule,
    AuthModule,
    IdentityModule,
    UserModule,
    ProfileModule,
    PermissionModule,
    SessionModule,
    AuditModule,
    OrganizationModule,
    WorkspaceModule,
    ClaimModule,
    EvidenceModule,
    CredentialModule,
    VerificationModule,
    KnowledgeModule,
    TrustModule,
    ConfidenceModule,
    TimelineModule,
    CareerPassportModule,
  ],
  controllers: [AppController, CsrfController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CSRF middleware disabled — stateless JWT auth uses SameSite cookies
  }
}
