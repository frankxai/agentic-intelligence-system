# @frankx-ai/ais-emit

Build-time emitters to generate structured capability descriptions for automated crawlers and AI search systems.

## Features
* **llms.txt generator:** Generates a structured profile description readable by AI search bots.
* **agents.json generator:** Machine-readable description of capabilities.
* **JSON-LD schema generator:** Generates structured metadata schema markup for website headers.

Emitters accept a `PublicProfile`, so only the `publicDiscovery` allowlist can reach the output.

## API Usage

```typescript
import { loadPublicProfile } from '@frankx-ai/ais-core';
import { generateLlmsText, generateAgentsJson } from '@frankx-ai/ais-emit';

const profile = loadPublicProfile('/path/to/ais-profile.yaml');
const llmsText = generateLlmsText(profile);
const agentsJson = generateAgentsJson(profile);
```
