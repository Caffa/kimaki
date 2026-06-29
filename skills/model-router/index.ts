/** Model Router - Task classification and model recommendation */

export type TaskType = 'coding' | 'reasoning' | 'content' | 'vision';
export type Complexity = 'simple' | 'medium' | 'complex';

export interface TaskClassification { type: TaskType; complexity: Complexity; confidence: number; }
export interface ContextInfo { hasImages?: boolean; affectedFiles?: number; lineCount?: number; }
export interface ComplexityMapping { simple: string; medium: string; complex: string; }
export interface ModelRouterConfig {
  mode: 'suggest' | 'auto';
  defaults: { coding: ComplexityMapping; reasoning: ComplexityMapping; content: string; vision: string; fallback: string; };
  preferLocal?: boolean; costOptimization?: boolean;
}
export interface ModelRecommendation { model: string; reason: string; alternatives: string[]; }

export const DEFAULT_CONFIG: ModelRouterConfig = {
  mode: 'suggest',
  defaults: {
    coding: { simple: 'qwen2.5-coder:7b', medium: 'qwen2.5-coder:14b', complex: 'qwen2.5-coder:32b' },
    reasoning: { simple: 'qwen3:8b', medium: 'qwen3:14b', complex: 'qwen3:30b' },
    content: 'kimi-k2.5', vision: 'gemma3:12b', fallback: 'glm-4:9b'
  },
  preferLocal: true, costOptimization: false,
};

// Task detection patterns
const CODING = [/\b(refactor|implement|fix|debug|add feature|optimize)\b/i,/\b(function|class|component|module|api|endpoint)\b/i,/```[\s\S]*?```/];
const REASONING = [/\b(analyze|design|architecture|plan|strategy|evaluate|compare)\b/i,/\b(should|why|how to|best way|trade-off|tradeoff)\b/i];
const VISION = [/\b(screenshot|image|picture|diagram|chart|mockup|visual)\b/i,/\b(ui|ux|design|layout)\b/i];
const SIMPLE = [/\b(typo|lint|format|rename|single line|one line)\b/i,/\b<\s*3\s+files?/,/\b<\s*50\s+(lines?|chars?)\b/i];
const COMPLEX = [/\b(architect|redesign|from scratch|major refactor)\b/i,/>\s*5\s+files?/,/\b(multi-step|complex|large scale)\b/i];

export function classifyTask(msg: string, ctx?: ContextInfo): TaskClassification {
  const type = detectTaskType(msg, ctx);
  const complexity = estimateComplexity(msg, ctx);
  const confidence = calculateConfidence(msg, type);
  return { type, complexity, confidence };
}

function detectTaskType(msg: string, ctx?: ContextInfo): TaskType {
  if (ctx?.hasImages || VISION.some(p=>p.test(msg))) return 'vision';
  if (CODING.filter(p=>p.test(msg)).length >= 2) return 'coding';
  if (REASONING.filter(p=>p.test(msg)).length >= 2) return 'reasoning';
  if (/\b(code|function|class|variable|import|export)\b/i.test(msg)) return 'coding';
  return 'content';
}

function estimateComplexity(msg: string, ctx?: ContextInfo): Complexity {
  const fc = ctx?.affectedFiles ?? 0;
  if (fc > 5) return 'complex';
  if (fc > 2) return 'medium';
  const lc = ctx?.lineCount ?? 0;
  if (lc > 500) return 'complex';
  if (lc > 100) return 'medium';
  if (COMPLEX.some(p=>p.test(msg))) return 'complex';
  if (SIMPLE.some(p=>p.test(msg))) return 'simple';
  return msg.length > 500 ? 'medium' : 'simple';
}

function calculateConfidence(msg: string, type: TaskType): number {
  if (type === 'content') return 0.7;
  const patterns = type === 'coding' ? CODING : type === 'reasoning' ? REASONING : VISION;
  const matches = patterns.filter(p=>p.test(msg)).length;
  return Math.min(0.5 + (matches * 0.15), 0.95);
}

export function recommendModel(cls: TaskClassification, cfg: ModelRouterConfig = DEFAULT_CONFIG): ModelRecommendation {
  let model: string, reason: string, alternatives: string[] = [];
  
  switch (cls.type) {
    case 'coding':
      model = cfg.defaults.coding[cls.complexity];
      reason = `${cls.complexity} coding task`;
      alternatives = [cfg.defaults.coding.medium, cfg.defaults.fallback];
      break;
    case 'reasoning':
      model = cfg.defaults.reasoning[cls.complexity];
      reason = `${cls.complexity} reasoning task`;
      alternatives = [cfg.defaults.reasoning.medium, cfg.defaults.fallback];
      break;
    case 'vision':
      model = cfg.defaults.vision;
      reason = 'Vision task';
      alternatives = [cfg.defaults.coding.medium, cfg.defaults.fallback];
      break;
    default:
      model = cfg.defaults.content;
      reason = 'Content/chat task';
      alternatives = [cfg.defaults.reasoning.medium, cfg.defaults.fallback];
  }
  
  if (cfg.costOptimization && cls.complexity === 'simple' && cls.type === 'coding') {
    alternatives.unshift(model);
    model = cfg.defaults.coding.simple;
    reason += ' (cost-optimized)';
  }
  
  return { model, reason, alternatives };
}

export function getFallbackChain(failed: string, cls: TaskClassification, cfg: ModelRouterConfig = DEFAULT_CONFIG): string[] {
  const chain: string[] = [];
  if (cls.type === 'coding' || cls.type === 'reasoning') {
    if (cls.complexity === 'complex') chain.push(cfg.defaults[cls.type].medium);
    if (cls.complexity !== 'simple') chain.push(cfg.defaults[cls.type].simple);
  }
  chain.push(cfg.defaults.fallback);
  return chain.filter((m, i, arr) => arr.indexOf(m) === i);
}

export function extractExplicitModel(msg: string): string | null {
  const m = msg.match(/\b(use|with|try)\s+(qwen[\w.-]*|kimi[\w.-]*|gemma[\w.-]*|glm[\w.-]*)\b/i);
  return m?.[2] || null;
}

export function suggestModelForFile(fp: string): ModelRecommendation | null {
  const ext = fp.split('.').pop()?.toLowerCase() || '';
  const img = ['png','jpg','jpeg','gif','webp','svg'].includes(ext);
  const code = ['js','ts','jsx','tsx','py','rs','go','java','cpp','c'].includes(ext);
  
  if (img) return { model: DEFAULT_CONFIG.defaults.vision, reason: `Image (${ext})`, alternatives: ['gemma3:4b', DEFAULT_CONFIG.defaults.fallback] };
  if (code) return { model: DEFAULT_CONFIG.defaults.coding.medium, reason: `Code (${ext})`, alternatives: [DEFAULT_CONFIG.defaults.coding.simple, DEFAULT_CONFIG.defaults.coding.complex] };
  return null;
}
