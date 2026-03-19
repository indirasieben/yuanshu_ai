import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Copy, Check, Trash2, Eye, EyeOff, Key,
  Search, X, ChevronLeft, ChevronRight, AlertTriangle, ClipboardList,
} from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

// ---------- 状态徽章 ----------
const STATUS_MAP = {
  1: { label: '已启用', cls: 'bg-green-100 text-green-700' },
  2: { label: '已禁用', cls: 'bg-gray-100 text-gray-500' },
  3: { label: '已过期', cls: 'bg-orange-100 text-orange-600' },
  4: { label: '已耗尽', cls: 'bg-red-100 text-red-600' },
}
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP[2]
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}>{s.label}</span>
}

// ---------- 额度进度条 ----------
function QuotaProgress({ token }) {
  if (token.unlimited_quota) return <span className="text-xs text-ink-faint">无限</span>
  const used = token.used_quota || 0
  const total = used + (token.remain_quota || 0)
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
  return (
    <div className="min-w-[80px]">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
          <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-ink-muted w-7 text-right">{pct.toFixed(0)}%</span>
      </div>
      <p className="text-[10px] text-ink-faint">{fmt(used)} / {fmt(total)}</p>
    </div>
  )
}

// ---------- 令牌行 ----------
function TokenRow({ token, selected, onSelect, onToggleReveal, revealed, resolvedKey, onCopy, copiedId, onStatusToggle, onEdit, onDelete }) {
  const tail = (token.key || '').slice(-4)
  const head = (token.key || '').slice(0, 4)
  const maskedKey = `sk-${head}****${tail}`
  const displayKey = revealed ? (resolvedKey ? `sk-${resolvedKey}` : '加载中…') : maskedKey
  const expiry = token.expired_time === -1
    ? '永不过期'
    : token.expired_time > 0
      ? new Date(token.expired_time * 1000).toLocaleDateString('zh-CN')
      : '—'
  const modelList = token.model_limits ? token.model_limits.split(',').filter(Boolean) : []

  return (
    <tr className="border-b border-border last:border-0 hover:bg-cream-light/50 transition-colors">
      <td className="px-3 py-3 text-center">
        <input type="checkbox" checked={selected} onChange={() => onSelect(token.id)} className="rounded border-border cursor-pointer" />
      </td>
      <td className="px-3 py-3">
        <span className="text-xs text-ink-muted">{token.name || '未命名'}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <code className="text-[11px] font-mono text-ink-muted select-all">{displayKey}</code>
          <button onClick={() => onToggleReveal(token.id)} title={revealed ? '隐藏' : '显示完整密钥'}
            className="p-1 rounded text-ink-faint hover:text-ink bg-transparent border-none cursor-pointer flex-shrink-0">
            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button onClick={() => onCopy(revealed && resolvedKey ? `sk-${resolvedKey}` : maskedKey, `key-${token.id}`)}
            className="p-1 rounded text-ink-faint hover:text-ink bg-transparent border-none cursor-pointer flex-shrink-0">
            {copiedId === `key-${token.id}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
          </button>
        </div>
      </td>
      <td className="px-3 py-3"><StatusBadge status={token.status} /></td>
      <td className="px-3 py-3">
        <span className="text-xs text-ink-muted">{token.group || 'auto'}</span>
      </td>
      <td className="px-3 py-3">
        {token.model_limits_enabled && modelList.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[130px]">
            {modelList.slice(0, 2).map(m => (
              <span key={m} className="px-1.5 py-0.5 bg-cream-dark text-ink-muted text-[10px] rounded truncate max-w-[60px]">{m}</span>
            ))}
            {modelList.length > 2 && <span className="text-[10px] text-ink-faint">+{modelList.length - 2}</span>}
          </div>
        ) : (
          <span className="text-xs text-ink-faint">不限</span>
        )}
      </td>
      <td className="px-3 py-3"><QuotaProgress token={token} /></td>
      <td className="px-3 py-3">
        <span className="text-xs text-ink-muted whitespace-nowrap">{expiry}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 flex-wrap">
          {token.status === 1 ? (
            <button onClick={() => onStatusToggle(token, 2)}
              className="px-2 py-1 text-[11px] rounded text-ink-muted border border-border hover:bg-cream-dark bg-transparent cursor-pointer transition-colors whitespace-nowrap">
              禁用
            </button>
          ) : token.status === 2 ? (
            <button onClick={() => onStatusToggle(token, 1)}
              className="px-2 py-1 text-[11px] rounded text-green-600 border border-green-200 hover:bg-green-50 bg-transparent cursor-pointer transition-colors whitespace-nowrap">
              启用
            </button>
          ) : null}
          <button onClick={() => onEdit(token)}
            className="px-2 py-1 text-[11px] rounded text-ink-muted border border-border hover:bg-cream-dark bg-transparent cursor-pointer transition-colors">
            编辑
          </button>
          <button onClick={() => onDelete(token.id)}
            className="px-2 py-1 text-[11px] rounded text-red-500 border border-red-100 hover:bg-red-50 bg-transparent cursor-pointer transition-colors">
            删除
          </button>
        </div>
      </td>
    </tr>
  )
}

// ---------- 创建/编辑弹窗 ----------
function TokenModal({ mode, token, onClose, onSaved, models, groups }) {
  const isCreate = mode === 'create'
  const initForm = () => ({
    name: isCreate ? '' : (token?.name || ''),
    tokenCount: 1,
    remain_quota: isCreate ? 500000 : (token?.remain_quota ?? 500000),
    unlimited_quota: isCreate ? true : (token?.unlimited_quota ?? true),
    expired_time: isCreate ? -1 : (token?.expired_time ?? -1),
    neverExpires: isCreate ? true : ((token?.expired_time ?? -1) === -1),
    model_limits: isCreate ? [] : (token?.model_limits ? token.model_limits.split(',').filter(Boolean) : []),
    allow_ips: isCreate ? '' : (token?.allow_ips || ''),
    group: isCreate ? 'auto' : (token?.group || 'auto'),
    cross_group_retry: isCreate ? false : (token?.cross_group_retry ?? false),
  })
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const tsToLocal = (ts) => {
    if (!ts || ts === -1) return ''
    return new Date(ts * 1000).toISOString().slice(0, 16)
  }
  const localToTs = (s) => s ? Math.floor(new Date(s).getTime() / 1000) : -1

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        remain_quota: form.unlimited_quota ? 0 : Number(form.remain_quota),
        unlimited_quota: form.unlimited_quota,
        expired_time: form.neverExpires ? -1 : form.expired_time,
        model_limits: form.model_limits.join(','),
        model_limits_enabled: form.model_limits.length > 0,
        allow_ips: form.allow_ips,
        group: form.group,
        cross_group_retry: form.cross_group_retry,
      }
      if (isCreate) {
        const count = Math.max(1, Number(form.tokenCount) || 1)
        for (let i = 0; i < count; i++) {
          const name = count > 1
            ? `${form.name || 'key'}-${Math.random().toString(36).slice(-6)}`
            : form.name
          await api.post('/api/token/', { ...payload, name })
        }
        toast.success(count > 1 ? `成功创建 ${count} 个 API Key` : 'API Key 创建成功')
      } else {
        await api.put('/api/token/', { ...payload, id: token.id })
        toast.success('API Key 更新成功')
      }
      onSaved()
      onClose()
    } catch {
      toast.error(isCreate ? '创建失败' : '更新失败')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col max-h-[92vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${isCreate ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}`}>
              {isCreate ? '新建' : '更新'}
            </span>
            <h3 className="text-sm font-medium text-ink">{isCreate ? '创建新的 API Key' : '编辑 API Key'}</h3>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink bg-transparent border-none cursor-pointer p-1">
            <X size={16} />
          </button>
        </div>

        {/* 表单 - 可滚动 */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Key 名称 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">Key 名称</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} maxLength={50}
              placeholder="最长 50 字符" autoFocus
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors" />
          </div>

          {/* 创建数量（仅新建） */}
          {isCreate && (
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">创建数量</label>
              <input type="number" min={1} value={form.tokenCount}
                onChange={e => set('tokenCount', parseInt(e.target.value) || 1)}
                className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors" />
            </div>
          )}

          {/* 剩余额度 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">剩余额度</label>
            <div className="flex items-center gap-3">
              <input type="number" min={0} value={form.remain_quota} disabled={form.unlimited_quota}
                onChange={e => set('remain_quota', parseFloat(e.target.value) || 0)}
                className="flex-1 border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors disabled:opacity-40" />
              <label className="flex items-center gap-1.5 text-xs text-ink-muted whitespace-nowrap cursor-pointer select-none">
                <input type="checkbox" checked={form.unlimited_quota} onChange={e => set('unlimited_quota', e.target.checked)} className="rounded border-border cursor-pointer" />
                无限额度
              </label>
            </div>
          </div>

          {/* 过期时间 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">过期时间</label>
            <div className="flex items-center gap-3">
              <input type="datetime-local" disabled={form.neverExpires}
                value={form.neverExpires ? '' : tsToLocal(form.expired_time)}
                onChange={e => set('expired_time', localToTs(e.target.value))}
                className="flex-1 border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors disabled:opacity-40" />
              <label className="flex items-center gap-1.5 text-xs text-ink-muted whitespace-nowrap cursor-pointer select-none">
                <input type="checkbox" checked={form.neverExpires} onChange={e => set('neverExpires', e.target.checked)} className="rounded border-border cursor-pointer" />
                永不过期
              </label>
            </div>
          </div>

          {/* 模型限制 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">
              模型限制
              {form.model_limits.length > 0 && (
                <span className="ml-2 text-[10px] text-ink-faint">已选 {form.model_limits.length} 个</span>
              )}
            </label>
            <div className="border border-border rounded-xl bg-cream-light p-3 max-h-[160px] overflow-y-auto">
              {models.length === 0 ? (
                <p className="text-xs text-ink-faint">暂无可用模型</p>
              ) : models.map(m => {
                const id = typeof m === 'string' ? m : (m.id || m.model_name || '')
                return (
                  <label key={id} className="flex items-center gap-2 py-0.5 cursor-pointer text-xs text-ink hover:text-ink-muted select-none">
                    <input type="checkbox" checked={form.model_limits.includes(id)}
                      onChange={e => set('model_limits', e.target.checked ? [...form.model_limits, id] : form.model_limits.filter(x => x !== id))}
                      className="rounded border-border cursor-pointer" />
                    {id}
                  </label>
                )
              })}
            </div>
          </div>

          {/* IP 白名单 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">IP 白名单</label>
            <textarea value={form.allow_ips} onChange={e => set('allow_ips', e.target.value)} rows={3}
              placeholder="每行一个 IP 或 CIDR，留空表示不限制"
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors resize-none font-mono text-xs" />
          </div>

          {/* 分组 */}
          <div>
            <label className="block text-xs text-ink-muted mb-1.5">分组</label>
            <select value={form.group} onChange={e => set('group', e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors">
              <option value="auto">auto（智能熔断）</option>
              {groups.filter(g => g !== 'auto').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* 跨分组重试 */}
          {form.group === 'auto' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.cross_group_retry} onChange={e => set('cross_group_retry', e.target.checked)} className="rounded border-border cursor-pointer" />
              <span className="text-xs text-ink-muted">跨分组重试（失败时自动切换分组）</span>
            </label>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent border border-border cursor-pointer transition-colors">
            取消
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium text-cream-light bg-ink hover:bg-ink-light border-none cursor-pointer transition-colors disabled:opacity-50">
            {saving ? '保存中…' : '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- 批量复制弹窗 ----------
function BatchCopyModal({ tokens, resolvedKeys, onClose }) {
  const [copying, setCopying] = useState(false)

  const doCopy = async (withName) => {
    setCopying(true)
    try {
      const fetched = { ...resolvedKeys }
      await Promise.all(tokens.map(async t => {
        if (!fetched[t.id]) {
          try {
            const res = await api.post(`/api/token/${t.id}/key`)
            if (res?.data?.key) fetched[t.id] = res.data.key
          } catch {}
        }
      }))
      const lines = tokens.map(t => {
        const key = `sk-${fetched[t.id] || t.key}`
        return withName ? `${t.name}\t${key}` : key
      })
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success(`已复制 ${tokens.length} 个 API Key`)
      onClose()
    } catch {
      toast.error('复制失败，请检查剪贴板权限')
    }
    setCopying(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-sm shadow-lg">
        <div className="px-6 pt-5 pb-3">
          <h3 className="text-sm font-medium text-ink">复制 API Key</h3>
          <p className="text-xs text-ink-muted mt-1">请选择复制方式（共 {tokens.length} 个 API Key）</p>
        </div>
        <div className="flex gap-3 px-6 pb-4">
          <button onClick={() => doCopy(true)} disabled={copying}
            className="flex-1 py-2.5 rounded-xl text-sm border border-border text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors disabled:opacity-50">
            名称+密钥
          </button>
          <button onClick={() => doCopy(false)} disabled={copying}
            className="flex-1 py-2.5 rounded-xl text-sm bg-ink text-cream-light hover:bg-ink-light border-none cursor-pointer transition-colors disabled:opacity-50">
            仅密钥
          </button>
        </div>
        <div className="px-6 pb-5 text-center">
          <button onClick={onClose} className="text-xs text-ink-faint hover:text-ink-muted bg-transparent border-none cursor-pointer">取消</button>
        </div>
      </div>
    </div>
  )
}

// ---------- 批量删除弹窗 ----------
function BatchDeleteModal({ count, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-sm shadow-lg p-6">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-ink">批量删除 API Key</h3>
            <p className="text-xs text-ink-muted mt-1.5">确定要删除所选的 <strong className="text-ink">{count}</strong> 个 API Key 吗？此操作不可撤销。</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent border border-border cursor-pointer transition-colors">
            取消
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer transition-colors disabled:opacity-50">
            {loading ? '删除中…' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- 主页面 ----------
export default function ApiKeysPage() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchToken, setSearchToken] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [resolvedKeys, setResolvedKeys] = useState({})
  const [revealedIds, setRevealedIds] = useState(new Set())
  const [copiedId, setCopiedId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editToken, setEditToken] = useState(null)
  const [showBatchCopy, setShowBatchCopy] = useState(false)
  const [showBatchDelete, setShowBatchDelete] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [models, setModels] = useState([])
  const [groups, setGroups] = useState([])

  const baseUrl = window.location.origin + '/v1'

  // 拷贝辅助
  const handleCopy = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }, [])

  // 获取令牌列表
  const fetchTokens = useCallback(async (pg, pz) => {
    setLoading(true)
    try {
      const data = await api.get(`/api/token/?p=${pg}&size=${pz}`)
      const items = data?.data?.items
      if (Array.isArray(items)) {
        setTokens(items)
        setTotal(data?.data?.total || 0)
      }
    } catch {
      toast.error('获取 API Key 列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 搜索
  const handleSearch = async () => {
    setLoading(true)
    setIsSearchMode(true)
    const kw = searchKeyword.trim()
    const tk = searchToken.trim().replace(/^sk-/, '')
    try {
      const data = await api.get(`/api/token/search?keyword=${encodeURIComponent(kw)}&token=${encodeURIComponent(tk)}&p=1&size=${pageSize}`)
      const items = data?.data?.items
      if (Array.isArray(items)) {
        setTokens(items)
        setTotal(data?.data?.total || items.length)
        setPage(1)
      }
    } catch {
      toast.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchKeyword('')
    setSearchToken('')
    setIsSearchMode(false)
    setPage(1)
    fetchTokens(1, pageSize)
  }

  // 初始化
  useEffect(() => {
    fetchTokens(1, pageSize)
    Promise.all([api.get('/api/user/models'), api.get('/api/user/self/groups')]).then(([mRes, gRes]) => {
      if (Array.isArray(mRes?.data)) setModels(mRes.data)
      if (Array.isArray(gRes?.data)) setGroups(gRes.data)
    }).catch(() => {})
  }, [])

  const goPage = (p) => {
    setPage(p)
    if (!isSearchMode) fetchTokens(p, pageSize)
  }

  const changePageSize = (pz) => {
    setPageSize(pz)
    setPage(1)
    if (!isSearchMode) fetchTokens(1, pz)
  }

  // 选中逻辑
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    setSelectedIds(selectedIds.size === tokens.length ? new Set() : new Set(tokens.map(t => t.id)))
  }

  // 显示/隐藏完整密钥
  const handleToggleReveal = async (id) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); return next }
      next.add(id)
      return next
    })
    if (!resolvedKeys[id]) {
      try {
        const res = await api.post(`/api/token/${id}/key`)
        if (res?.data?.key) setResolvedKeys(prev => ({ ...prev, [id]: res.data.key }))
      } catch {
        toast.error('获取完整密钥失败')
      }
    }
  }

  // 状态切换
  const handleStatusToggle = async (token, newStatus) => {
    try {
      await api.put('/api/token/?status_only=true', { id: token.id, status: newStatus })
      toast.success(newStatus === 1 ? '已启用' : '已禁用')
      fetchTokens(page, pageSize)
    } catch {
      toast.error('操作失败')
    }
  }

  // 删除单个
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/token/${id}`)
      toast.success('已删除')
      fetchTokens(page, pageSize)
    } catch {
      toast.error('删除失败')
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    setBatchDeleting(true)
    try {
      await api.post('/api/token/batch', { ids: [...selectedIds] })
      toast.success(`已删除 ${selectedIds.size} 个 API Key`)
      setSelectedIds(new Set())
      setShowBatchDelete(false)
      fetchTokens(page, pageSize)
    } catch {
      toast.error('批量删除失败')
    }
    setBatchDeleting(false)
  }

  const selectedTokens = tokens.filter(t => selectedIds.has(t.id))
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allSelected = tokens.length > 0 && selectedIds.size === tokens.length

  return (
    <div className="min-h-screen bg-cream">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-cream-light/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/chat" className="text-ink-muted hover:text-ink transition-colors no-underline flex items-center gap-1 text-sm">
            <ArrowLeft size={16} />
            返回
          </Link>
          <div className="flex items-center gap-2">
            <Key size={15} className="text-ink-muted" />
            <h1 className="text-base font-medium text-ink">API 设置</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* ===== 接入信息 ===== */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-ink mb-3">接入信息</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-ink-muted mb-1">Base URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-cream-light text-sm text-ink font-mono border border-border">
                  {baseUrl}
                </code>
                <button onClick={() => handleCopy(baseUrl, 'baseurl')}
                  className="p-2 rounded-lg border border-border bg-cream-light hover:bg-cream-dark text-ink-muted hover:text-ink cursor-pointer transition-colors flex-shrink-0">
                  {copiedId === 'baseurl' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              兼容 OpenAI API 格式，已有代码只需替换 <code className="text-ink font-mono bg-cream-dark px-1 py-0.5 rounded text-[11px]">base_url</code> 即可使用。支持 Chatbox、Cursor、Open Interpreter 等所有兼容客户端。
            </p>
          </div>
        </div>

        {/* ===== 代码示例 ===== */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-medium text-ink mb-3">快速接入示例</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Python */}
            <div>
              <p className="text-xs text-ink-muted mb-2">Python</p>
              <div className="relative">
                <pre className="bg-cream-light border border-border rounded-lg px-4 pt-4 pb-4 text-[12px] font-mono text-ink leading-relaxed h-[220px] overflow-y-auto">
{`from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="sk-..."
)

resp = client.chat.completions.create(
    model="claude-4-sonnet",
    messages=[{"role": "user",
               "content": "你好"}]
)`}
                </pre>
                <button
                  onClick={() => handleCopy(`from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${baseUrl}",\n    api_key="sk-..."\n)\n\nresp = client.chat.completions.create(\n    model="claude-4-sonnet",\n    messages=[{"role": "user",\n               "content": "你好"}]\n)`, 'code-python')}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-cream-dark hover:bg-cream border border-border text-ink-muted hover:text-ink cursor-pointer transition-colors"
                  title="复制代码">
                  {copiedId === 'code-python' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            {/* cURL */}
            <div>
              <p className="text-xs text-ink-muted mb-2">cURL</p>
              <div className="relative">
                <pre className="bg-cream-light border border-border rounded-lg px-4 pt-4 pb-4 text-[12px] font-mono text-ink leading-relaxed h-[220px] overflow-y-auto">
{`curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-4-sonnet",
    "messages": [
      {"role": "user",
       "content": "你好"}
    ]
  }'`}
                </pre>
                <button
                  onClick={() => handleCopy(`curl ${baseUrl}/chat/completions \\\n  -H "Authorization: Bearer sk-..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "claude-4-sonnet",\n    "messages": [\n      {"role": "user",\n       "content": "你好"}\n    ]\n  }'`, 'code-curl')}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-cream-dark hover:bg-cream border border-border text-ink-muted hover:text-ink cursor-pointer transition-colors"
                  title="复制代码">
                  {copiedId === 'code-curl' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 令牌管理区域 ===== */}
        <div className="bg-card rounded-xl border border-border">
          {/* —— 搜索栏 —— */}
          <div className="p-5 border-b border-border">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-ink-muted mb-1">Key 名称</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <input value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="输入名称搜索…"
                    className="w-full pl-8 pr-3 py-2 border border-border rounded-xl bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors" />
                </div>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-ink-muted mb-1">密钥值</label>
                <div className="relative">
                  <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <input value={searchToken} onChange={e => setSearchToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="sk- 前缀自动忽略"
                    className="w-full pl-8 pr-3 py-2 border border-border rounded-xl bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors" />
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleSearch}
                  className="px-4 py-2 rounded-xl text-sm bg-ink text-cream-light hover:bg-ink-light border-none cursor-pointer transition-colors font-medium">
                  查询
                </button>
                <button onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent border border-border cursor-pointer transition-colors">
                  重置
                </button>
              </div>
            </div>
          </div>

          {/* —— 操作栏 —— */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors">
              <Plus size={13} />
              添加 API Key
            </button>
            <button
              onClick={() => selectedIds.size > 0 && setShowBatchCopy(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ClipboardList size={13} />
              复制所选 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
            <button
              onClick={() => selectedIds.size > 0 && setShowBatchDelete(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-100 text-red-500 hover:bg-red-50 bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 size={13} />
              删除所选 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
            <span className="ml-auto text-xs text-ink-faint">共 {total} 条</span>
          </div>

          {/* —— 表格 —— */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-cream-light/60">
                  <th className="px-3 py-2.5 text-center w-8">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="rounded border-border cursor-pointer" />
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">名称</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">密钥</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">状态</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">分组</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">模型限制</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">额度用量</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">过期时间</th>
                  <th className="px-3 py-2.5 text-[11px] font-medium text-ink-muted">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-sm text-ink-muted">加载中…</td>
                  </tr>
                ) : tokens.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-16 text-center">
                      <Key size={28} className="text-ink-faint mx-auto mb-3" />
                      <p className="text-sm text-ink-muted">{isSearchMode ? '未找到符合条件的 API Key' : '暂无 API Key'}</p>
                      {!isSearchMode && (
                        <p className="text-xs text-ink-faint mt-1">点击「添加 API Key」创建您的第一个 API Key</p>
                      )}
                    </td>
                  </tr>
                ) : tokens.map(token => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    selected={selectedIds.has(token.id)}
                    onSelect={toggleSelect}
                    revealed={revealedIds.has(token.id)}
                    resolvedKey={resolvedKeys[token.id]}
                    onToggleReveal={handleToggleReveal}
                    onCopy={handleCopy}
                    copiedId={copiedId}
                    onStatusToggle={handleStatusToggle}
                    onEdit={setEditToken}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* —— 分页 —— */}
          {!loading && tokens.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                每页
                <select value={pageSize} onChange={e => changePageSize(Number(e.target.value))}
                  className="border border-border rounded-lg px-2 py-1 bg-cream-light text-ink text-xs outline-none focus:border-ink-muted cursor-pointer">
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                条
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p
                  if (totalPages <= 7) p = i + 1
                  else if (page <= 4) p = i + 1
                  else if (page >= totalPages - 3) p = totalPages - 6 + i
                  else p = page - 3 + i
                  return (
                    <button key={p} onClick={() => goPage(p)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs border transition-colors cursor-pointer ${page === p ? 'bg-ink text-cream-light border-ink' : 'border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent'}`}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => goPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 弹窗层 ===== */}
      {showCreateModal && (
        <TokenModal mode="create" onClose={() => setShowCreateModal(false)}
          onSaved={() => fetchTokens(page, pageSize)} models={models} groups={groups} />
      )}
      {editToken && (
        <TokenModal mode="edit" token={editToken} onClose={() => setEditToken(null)}
          onSaved={() => fetchTokens(page, pageSize)} models={models} groups={groups} />
      )}
      {showBatchCopy && (
        <BatchCopyModal tokens={selectedTokens} resolvedKeys={resolvedKeys} onClose={() => setShowBatchCopy(false)} />
      )}
      {showBatchDelete && (
        <BatchDeleteModal count={selectedIds.size} loading={batchDeleting}
          onConfirm={handleBatchDelete} onClose={() => setShowBatchDelete(false)} />
      )}
    </div>
  )
}
