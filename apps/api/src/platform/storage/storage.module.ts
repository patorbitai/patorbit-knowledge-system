import { Module, DynamicModule, Provider } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { LocalMinioStorageProvider } from "./providers/local-minio.storage-provider";
import { DiskStorageProvider } from "./providers/disk.storage-provider";
import { STORAGE_PROVIDER } from "./storage.constants";

export type StorageProviderType = "minio" | "disk";

export interface StorageModuleOptions {
  provider: StorageProviderType;
  diskBaseDir?: string;
}

@Module({})
export class StorageModule {
  static forRoot(options?: StorageModuleOptions): DynamicModule {
    const providerType = options?.provider ?? "disk";

    const provider: Provider =
      providerType === "minio"
        ? {
            provide: STORAGE_PROVIDER,
            useClass: LocalMinioStorageProvider,
          }
        : {
            provide: STORAGE_PROVIDER,
            useFactory: () => new DiskStorageProvider(options?.diskBaseDir),
          };

    return {
      module: StorageModule,
      global: true,
      providers: [provider, StorageService],
      exports: [StorageService],
    };
  }
}
