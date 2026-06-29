/** Model capability database */

export interface ModelCapabilities {
  id: string; name: string; size: string; contextWindow: number;
  supportsVision: boolean; strengths: string[]; weaknesses: string[];
  bestFor: TaskCategory[]; speed: 'fast'|'medium'|'slow'; local: boolean; aliases?: string[];
}
export type TaskCategory = 'coding-simple'|'coding-complex'|'reasoning-simple'|'reasoning-complex'|'content-chat'|'content-docs'|'vision-analysis';

export const MODELS: ModelCapabilities[] = [
  // Qwen2.5-Coder
  { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', size: '7B', contextWindow: 128000, supportsVision: false,
    strengths: ['Fast','Code completion','Efficient'], weaknesses: ['Limited reasoning'], bestFor: ['coding-simple'], speed: 'fast', local: true },
  { id: 'qwen2.5-coder:14b', name: 'Qwen 2.5 Coder 14B', size: '14B', contextWindow: 128000, supportsVision: false,
    strengths: ['Balanced','Code repair','Refactoring'], weaknesses: ['Limited chat'], bestFor: ['coding-simple','coding-complex'], speed: 'medium', local: true },
  { id: 'qwen2.5-coder:32b', name: 'Qwen 2.5 Coder 32B', size: '32B', contextWindow: 128000, supportsVision: false,
    strengths: ['SOTA coding','Matches GPT-4o','Architecture'], weaknesses: ['Slow','High memory'], bestFor: ['coding-complex'], speed: 'slow', local: true },
  
  // Qwen3
  { id: 'qwen3:8b', name: 'Qwen 3 8B', size: '8B', contextWindow: 128000, supportsVision: false,
    strengths: ['Hybrid thinking','Fast mode','Agent'], weaknesses: ['Not code-specialized'], bestFor: ['reasoning-simple','content-chat'], speed: 'fast', local: true },
  { id: 'qwen3:14b', name: 'Qwen 3 14B', size: '14B', contextWindow: 128000, supportsVision: false,
    strengths: ['Balanced','MCP support','Tool calling'], weaknesses: ['No vision'], bestFor: ['reasoning-simple','reasoning-complex','content-chat'], speed: 'medium', local: true },
  { id: 'qwen3:30b', name: 'Qwen 3 30B', size: '30B', contextWindow: 128000, supportsVision: false,
    strengths: ['Complex reasoning','MoE efficient','Planning'], weaknesses: ['Higher latency'], bestFor: ['reasoning-complex'], speed: 'slow', local: true },
  
  // Kimi
  { id: 'kimi-k2.5', name: 'Kimi K2.5', size: 'Unknown', contextWindow: 256000, supportsVision: false,
    strengths: ['256K context','Excellent chat','Documents'], weaknesses: ['Cloud-only'], bestFor: ['content-chat','content-docs'], speed: 'medium', local: false },
  { id: 'kimi-k2.6', name: 'Kimi K2.6', size: 'Unknown', contextWindow: 256000, supportsVision: false,
    strengths: ['Enhanced reasoning','Long context'], weaknesses: ['Cloud-only','Slower'], bestFor: ['reasoning-complex','content-docs'], speed: 'slow', local: false },
  
  // Gemma3
  { id: 'gemma3:4b', name: 'Gemma 3 4B', size: '4B', contextWindow: 128000, supportsVision: true,
    strengths: ['Fast','Vision','Lightweight'], weaknesses: ['Limited reasoning'], bestFor: ['vision-analysis','coding-simple'], speed: 'fast', local: true },
  { id: 'gemma3:12b', name: 'Gemma 3 12B', size: '12B', contextWindow: 128000, supportsVision: true,
    strengths: ['Balanced vision+text','UI/UX'], weaknesses: ['Not code-specialized'], bestFor: ['vision-analysis','coding-simple','content-chat'], speed: 'medium', local: true },
  { id: 'gemma3:27b', name: 'Gemma 3 27B', size: '27B', contextWindow: 128000, supportsVision: true,
    strengths: ['Best single-GPU vision','Multimodal','Charts'], weaknesses: ['Slower'], bestFor: ['vision-analysis','reasoning-simple'], speed: 'slow', local: true },
  
  // GLM
  { id: 'glm-4:9b', name: 'GLM-4 9B', size: '9B', contextWindow: 128000, supportsVision: false,
    strengths: ['Reliable fallback','Multilingual'], weaknesses: ['Not specialized'], bestFor: ['coding-simple','reasoning-simple','content-chat'], speed: 'medium', local: true },
  { id: 'glm-5.1', name: 'GLM 5.1', size: 'Unknown', contextWindow: 128000, supportsVision: false,
    strengths: ['Strong reasoning','Cloud'], weaknesses: ['Cloud-only'], bestFor: ['reasoning-complex','content-chat'], speed: 'medium', local: false },
  { id: 'glm-5.2', name: 'GLM 5.2', size: 'Unknown', contextWindow: 128000, supportsVision: false,
    strengths: ['Best GLM reasoning','Agent'], weaknesses: ['Cloud-only','Slow'], bestFor: ['reasoning-complex'], speed: 'slow', local: false },
];

export function getModel(id: string): ModelCapabilities | undefined {
  return MODELS.find(m=>m.id===id||m.aliases?.includes(id));
}

export function getModelsForTask(cat: TaskCategory): ModelCapabilities[] {
  return MODELS.filter(m=>m.bestFor.includes(cat));
}

export function getLocalModels(): ModelCapabilities[] {
  return MODELS.filter(m=>m.local);
}

export function isVisionModel(id: string): boolean {
  return getModel(id)?.supportsVision ?? false;
}

export function getContextWindow(id: string): number {
  return getModel(id)?.contextWindow ?? 128000;
}

export function getModelChain(cat: TaskCategory, preferLocal=true): ModelCapabilities[] {
  let cands = getModelsForTask(cat);
  if (preferLocal) cands = cands.filter(m=>m.local);
  const speedOrder: Record<ModelCapabilities['speed'],number> = {fast:0,medium:1,slow:2};
  return cands.sort((a,b) => {
    const af = a.bestFor.includes(cat) ? 10 : 0;
    const bf = b.bestFor.includes(cat) ? 10 : 0;
    return (bf + speedOrder[b.speed]) - (af + speedOrder[a.speed]);
  });
}
