# 🖨️ @frankx-ai/ais-emit

Build-time emitters to generate structured capability descriptions for automated crawlers and AI search systems.

## Features
* **llms.txt Generator:** Generates a structured profile description readable by AI search bots.
* **agents.json Generator:** Machine-readable description of capabilities.
* **JSON-LD Schema Generator:** Generates structured metadata schema markup for website headers.

## API Usage

```typescript
import { loadSystemProfile } from '@frankx-ai/ais-core';
import { generateLlmsText, generateAgentsJson } from '@frankx-ai/ais-emit';

const profile = loadSystemProfile('/path/to/ais-profile.yaml');
const llmsText = generateLlmsText(profile);
const agentsJson = generateAgentsJson(profile);
```
