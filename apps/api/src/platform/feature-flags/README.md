# Feature Flags Module

This module provides a simple, environment-based feature flagging service.

## Usage

The `FeatureFlagsService` is registered as a global provider. Inject it into any service or controller:

```typescript
import { FeatureFlagsService } from '@platform/feature-flags';

@Injectable()
export class MyService {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  myMethod() {
    if (this.featureFlags.isEnabled('my_feature')) {
      // ...
    }
  }
}
```

## Configuration

Flags are configured via environment variables. The service automatically discovers variables prefixed with `FEATURE_`.

- `FEATURE_{NAME}=true` enables the flag.
- `FEATURE_{NAME}=false` disables the flag.

Example: `FEATURE_NEW_ONBOARDING=true`

The module also sets default values for `resume_builder`, `career_passport`, and `ai_features` if they are not explicitly set in the environment.
