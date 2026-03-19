export const conversations = [
  { id: 1, title: '如何用 Python 实现快速排序', time: '今天 14:30', model: 'GPT-4o' },
  { id: 2, title: '帮我写一份商业计划书大纲', time: '今天 10:15', model: 'Claude 4 Sonnet' },
  { id: 3, title: '解释量子计算的基本原理', time: '昨天 21:00', model: 'Gemini 2.5 Pro' },
  { id: 4, title: 'React vs Vue 技术选型分析', time: '昨天 16:45', model: 'DeepSeek R1' },
  { id: 5, title: '翻译这篇英文论文摘要', time: '3天前', model: 'GPT-4o' },
]

export const imageGenerations = [
  { id: 1, title: '赛博朋克风格城市', time: '今天 13:00' },
  { id: 2, title: '水墨山水画', time: '昨天 19:30' },
]

export const mockMessages = [
  {
    id: 1,
    role: 'user',
    content: '请用 JavaScript 实现一个防抖函数，并解释它的工作原理。',
    timestamp: '14:30',
  },
  {
    id: 2,
    role: 'assistant',
    content: `## 防抖函数（Debounce）

防抖函数的核心思想是：**在事件被触发后，延迟一段时间再执行回调。如果在延迟期间事件又被触发，则重新计时。**

### 实现代码

\`\`\`javascript
function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    // 清除之前的定时器
    clearTimeout(timer);

    // 设置新的定时器
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
\`\`\`

### 使用示例

\`\`\`javascript
const handleSearch = debounce((query) => {
  console.log('搜索:', query);
  // 发起 API 请求...
}, 500);

input.addEventListener('input', (e) => {
  handleSearch(e.target.value);
});
\`\`\`

### 工作原理

| 步骤 | 行为 | 结果 |
|------|------|------|
| 1 | 用户输入第一个字符 | 设置 500ms 定时器 |
| 2 | 200ms 后输入第二个字符 | 清除旧定时器，重设 500ms |
| 3 | 用户停止输入 | 500ms 后执行搜索 |

这样可以**避免频繁触发**，常用于搜索框输入、窗口 resize 等场景。`,
    timestamp: '14:30',
    model: 'GPT-4o',
    tokens: { input: 28, output: 256 },
  },
  {
    id: 3,
    role: 'user',
    content: '如何添加一个「立即执行」的选项？',
    timestamp: '14:32',
  },
  {
    id: 4,
    role: 'assistant',
    content: `好问题！可以增加一个 \`immediate\` 参数，让函数在第一次触发时立即执行：

\`\`\`javascript
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;

  return function (...args) {
    const callNow = immediate && !timer;

    clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, delay);

    if (callNow) fn.apply(this, args);
  };
}
\`\`\`

当 \`immediate = true\` 时，函数会在**首次触发时立即执行**，之后的连续触发会被忽略，直到静默期结束后才能再次触发。

这在提交按钮防重复点击的场景特别有用。`,
    timestamp: '14:32',
    model: 'GPT-4o',
    tokens: { input: 42, output: 185 },
  },
]
