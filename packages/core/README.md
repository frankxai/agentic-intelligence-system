# ⚙️ @frankx-ai/ais-core

The core validation schemas and configuration loaders for the Agentic Intelligence System.

## Features
* **Canonical Schema:** Standard Zod schemas validating workstation settings, agent capabilities, skills registries, and repository harness structures.
* **Unified Profile Loader:** Helper module that loads the system profile from the main YAML file (`ais-profile.yaml`) and verifies types.

## API Usage

```typescript
import { loadSystemProfile } from '@frankx-ai/ais-core';

const profile = loadSystemProfile('/path/to/ais-profile.yaml');
console.log(profile.workstation.machineName); // "Yoga Laptop"
```
