/**
 * 对话导出工具
 */

/**
 * 导出为 Markdown 文件
 */
export function exportAsMarkdown(conversation) {
  if (!conversation || !conversation.messages?.length) return

  const lines = [
    `# ${conversation.title || '对话'}`,
    '',
    `> 导出时间: ${new Date().toLocaleString('zh-CN')}`,
    `> 模型: ${conversation.model}`,
    '',
    '---',
    '',
  ]

  for (const msg of conversation.messages) {
    if (msg.error) continue
    const role = msg.role === 'user' ? '**用户**' : '**AI**'
    lines.push(`### ${role}`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
    if (msg.tokens) {
      lines.push(`_输入 ${msg.tokens.input} tokens / 输出 ${msg.tokens.output} tokens_`)
      lines.push('')
    }
    lines.push('---')
    lines.push('')
  }

  const md = lines.join('\n')
  downloadFile(md, `${conversation.title || '对话'}.md`, 'text/markdown')
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
