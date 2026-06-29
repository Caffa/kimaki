---
name: model-router
description: >
  Automatically route user prompts to the best AI model based on task type.
  Classifies prompts as coding/reasoning/content/vision and recommends optimal model.
  Use when implementing automatic model selection, /model suggestions, or task-based routing.
---

# Model Router

Smart model selection for Kimaki based on task classification.

## Quick Reference

| Task | Simple | Medium | Complex |
|------|--------|--------|---------|
| Coding | qwen2.5-coder:7b | qwen2.5-coder:14b | qwen2.5-coder:32b |
| Reasoning | qwen3:8b | qwen3:14b | qwen3:30b |
| Content | kimi-k2.5 | kimi-k2.5 | kimi-k2.6 |
| Vision | gemma3:12b | gemma3:12b | gemma3:27b |
| Fallback | glm-4:9b | glm-4:9b | glm-4:9b |

## Task Classification

**Coding:** `refactor`, `implement`, `fix`, `class`, `function`, code blocks
**Reasoning:** `analyze`, `design`, `architecture`, `plan`, `compare`
**Vision:** Images, `screenshot`, `diagram`, `mockup`
**Content:** Chat, docs, questions (default)

**Complexity:** Based on file count (<3=simple, 3-5=medium, >5=complex) and keywords.

## Usage

```typescript
import { classifyTask, recommendModel, DEFAULT_CONFIG } from './index';

const classification = classifyTask(message, { hasImages: false, affectedFiles: 3 });
const { model, reason } = recommendModel(classification, DEFAULT_CONFIG);
```

## Integration

Call `classifyTask` before dispatch in `thread-session-runtime.ts`:

```typescript
const classification = classifyTask(message, context);
const rec = recommendModel(classification, config);

if (config.mode === 'auto' && rec.model !== currentModel) {
  await switchModel(rec.model);
}
```

## Configuration

```typescript
{
  mode: 'suggest' | 'auto',
  defaults: {
    coding: { simple: '...', medium: '...', complex: '...' },
    reasoning: { simple: '...', medium: '...', complex: '...' },
    content: 'kimi-k2.5',
    vision: 'gemma3:12b',
    fallback: 'glm-4:9b'
  }
}
```

## Models

- **Qwen2.5-Coder:** 7B (fast), 14B (balanced), 32B (SOTA, GPT-4o level)
- **Qwen3:** 8B (fast), 14B (agent), 30B (MoE reasoning), supports hybrid thinking
- **Kimi:** 256K context, excellent chat, K2.6 for complex reasoning
- **Gemma3:** Vision-capable, 4B/12B/27B sizes, 128K context
- **GLM-4:** 9B reliable fallback, multilingual

## Key Functions

- `classifyTask(message, context)` → `{ type, complexity, confidence }`
- `recommendModel(classification, config)` → `{ model, reason, alternatives }`
- `getFallbackChain(failedModel, classification, config)` → string[]
- `extractExplicitModel(message)` → string | null
- `suggestModelForFile(filePath)` → recommendation | null

See `index.ts` for implementation, `models.ts` for capability definitions.
