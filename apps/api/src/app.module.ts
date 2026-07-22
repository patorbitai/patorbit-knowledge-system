import { type MiddlewareConsumer,Module, type NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, HttpAdapterHost } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "@patorbit/database";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { CareerPassportModule } from "./career-passport/career-passport.module";
import { ClaimModule } from "./claim/claim.module";
import { CsrfController } from "./common/csrf.controller";
import { ConfidenceModule } from "./confidence/confidence.module";
import { CredentialModule } from "./credential/credential.module";
import { EvidenceModule } from "./evidence/evidence.module";
import { IdentityModule } from "./identity/identity.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { OrganizationModule } from "./organization/organization.module";
import { PermissionModule } from "./permission/permission.module";
import { LoggingService,PlatformModule } from "./platform";
import { AllExceptionsFilter } from "./platform/errors/all-exceptions.filter";
import { ProfileModule } from "./profile/profile.module";
import { SessionModule } from "./session/session.module";
import { TimelineModule } from "./timeline/timeline.module";
import { TrustModule } from "./trust/trust.module";
import { UserModule } from "./user/user.module";
import { VerificationModule } from "./verification/verification.module";
import { WorkspaceModule } from "./workspace/workspace.module";

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] }),
    DatabaseModule,
    PlatformModule.forRoot(),
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
    {
      provide: APP_FILTER,
      useFactory: (adapterHost: HttpAdapterHost, logger: LoggingService) =>
        new AllExceptionsFilter(adapterHost, logger),
      inject: [HttpAdapterHost, LoggingService],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CSRF middleware disabled — stateless JWT auth uses SameSite cookies
  }
}
