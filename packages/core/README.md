# @frankx-ai/ais-core

The core validation schemas and configuration loaders for the Agentic Intelligence System.

## Features
* **Two trust domains:** `PublicProfileSchema` validates the allowlisted `publicDiscovery` section in `ais-profile.yaml`. `RuntimeProfileSchema` validates the local workstation, agent, skill, and repository-harness data.
* **Loaders:** `loadPublicProfile` and `loadRuntimeProfile` read one domain each. `loadSystemProfile` reads a combined file that keeps both domains together; use it only for a file that is not published.

## API Usage

```typescript
import { loadPublicProfile, loadRuntimeProfile } from '@frankx-ai/ais-core';

// Public build: reads only the publicDiscovery allowlist.
const publicProfile = loadPublicProfile('/path/to/ais-profile.yaml');

// Local runtime: reads the gitignored overlay.
const runtime = loadRuntimeProfile('/path/to/ais-runtime.local.yaml');
console.log(runtime.workstation.machineName);
```
