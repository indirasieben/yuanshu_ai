/**
 * 模型元数据 — 补充 new-api /v1/models 返回的基础信息
 * 用于模型列表页面展示更丰富的信息
 */
export const MODEL_META = {
  // OpenAI
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: '推荐',
    multimodal: true,
    description: 'OpenAI 旗舰模型，支持文本和图像输入，速度快、能力强',
    capabilities: ['对话', '代码', '分析', '视觉'],
    contextWindow: '128K',
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: '经济',
    multimodal: true,
    description: '高性价比选择，适合日常对话和简单任务',
    capabilities: ['对话', '代码', '视觉'],
    contextWindow: '128K',
  },
  'o3-mini': {
    name: 'o3-mini',
    provider: 'OpenAI',
    badge: '推理',
    multimodal: false,
    description: 'OpenAI 推理模型，适合数学、逻辑和编程',
    capabilities: ['推理', '数学', '代码'],
    contextWindow: '200K',
  },

  // Anthropic
  'claude-4-sonnet': {
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    badge: '推荐',
    multimodal: true,
    description: 'Anthropic 均衡模型，推理能力强，代码出色',
    capabilities: ['对话', '代码', '分析', '视觉'],
    contextWindow: '200K',
  },
  'claude-sonnet-4-5-20250514': {
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    badge: '新',
    multimodal: true,
    description: '最新一代 Sonnet，全面提升',
    capabilities: ['对话', '代码', '分析', '视觉'],
    contextWindow: '200K',
  },
  'claude-opus-4-5-20250514': {
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    badge: '旗舰',
    multimodal: true,
    description: 'Anthropic 最强模型，适合复杂推理和创作',
    capabilities: ['对话', '代码', '分析', '创作', '视觉'],
    contextWindow: '200K',
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: '快速',
    multimodal: true,
    description: '超快响应，适合简单任务和批量处理',
    capabilities: ['对话', '代码'],
    contextWindow: '200K',
  },

  // Google
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    badge: '',
    multimodal: true,
    description: 'Google 旗舰模型，多模态能力突出',
    capabilities: ['对话', '代码', '分析', '视觉'],
    contextWindow: '1M',
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: '快速',
    multimodal: true,
    description: '极速响应，超大上下文窗口',
    capabilities: ['对话', '代码', '视觉'],
    contextWindow: '1M',
  },

  // DeepSeek
  'deepseek-r1': {
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    badge: '热门',
    multimodal: false,
    description: '开源推理模型，数学和逻辑推理能力出色',
    capabilities: ['推理', '数学', '代码'],
    contextWindow: '64K',
  },
  'deepseek-chat': {
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: '',
    multimodal: false,
    description: '通用对话模型，中文能力优秀',
    capabilities: ['对话', '代码', '分析'],
    contextWindow: '64K',
  },

  // 阿里云
  'qwen-max': {
    name: 'Qwen Max',
    provider: '阿里云',
    badge: '',
    multimodal: false,
    description: '通义千问旗舰版，中文理解能力领先',
    capabilities: ['对话', '代码', '分析'],
    contextWindow: '32K',
  },

  // Meta
  'llama-4-maverick': {
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    badge: '',
    multimodal: false,
    description: 'Meta 开源大模型，通用能力均衡',
    capabilities: ['对话', '代码'],
    contextWindow: '128K',
  },

  // xAI
  'grok-3': {
    name: 'Grok 3',
    provider: 'xAI',
    badge: '新',
    multimodal: false,
    description: 'xAI 旗舰模型，推理能力出众',
    capabilities: ['对话', '推理', '代码'],
    contextWindow: '128K',
  },

  // Mistral
  'mistral-large-latest': {
    name: 'Mistral Large',
    provider: 'Mistral',
    badge: '',
    multimodal: false,
    description: 'Mistral 旗舰模型，欧洲 AI 领军',
    capabilities: ['对话', '代码', '分析'],
    contextWindow: '128K',
  },
}
