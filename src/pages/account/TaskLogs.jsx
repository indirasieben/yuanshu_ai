import { useState, useEffect, useCallback } from 'react'
import { Search, RotateCcw, ChevronLeft, ChevronRight, ListTodo, X, Copy, ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'

// ────────────────────────────────────────────────────────────
// 常量 & 工具函数
// ────────────────────────────────────────────────────────────

// Unix 秒 → 可读时间字符串
function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(/\//g, '-')
}

// datetime-local 输入值 → Unix 秒
function toUnixSec(datetimeLocal) {
  if (!datetimeLocal) return undefined
  return Math.floor(new Date(datetimeLocal).getTime() / 1000)
}

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return toDatetimeLocal(d)
}

function nowPlusOneHour() {
  const d = new Date(Date.now() + 3600 * 1000)
  return toDatetimeLocal(d)
}

function toDatetimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 任务状态枚举
const STATUS_MAP = {
  SUCCESS:     { label: '成功',   color: 'bg-green-100 text-green-700' },
  FAILURE:     { label: '失败',   color: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: '执行中', color: 'bg-blue-100 text-blue-700' },
  SUBMITTED:   { label: '队列中', color: 'bg-yellow-100 text-yellow-700' },
  QUEUED:      { label: '排队中', color: 'bg-orange-100 text-orange-700' },
  NOT_START:   { label: '未启动', color: 'bg-gray-100 text-gray-500' },
  UNKNOWN:     { label: '未知',   color: 'bg-gray-100 text-gray-400' },
  '':          { label: '提交中', color: 'bg-gray-100 text-gray-500' },
}

function getStatusInfo(status) {
  return STATUS_MAP[status] ?? STATUS_MAP['UNKNOWN']
}

// 任务类型枚举
const ACTION_MAP = {
  MUSIC:               { label: '生成音乐',   color: 'bg-gray-100 text-gray-600' },
  LYRICS:              { label: '生成歌词',   color: 'bg-pink-100 text-pink-700' },
  generate:            { label: '图生视频',   color: 'bg-blue-100 text-blue-700' },
  textGenerate:        { label: '文生视频',   color: 'bg-blue-100 text-blue-700' },
  firstTailGenerate:   { label: '首尾生视频', color: 'bg-blue-100 text-blue-700' },
  referenceGenerate:   { label: '参照生视频', color: 'bg-blue-100 text-blue-700' },
  remixGenerate:       { label: '视频Remix', color: 'bg-blue-100 text-blue-700' },
}

function getActionInfo(action) {
  return ACTION_MAP[action] ?? { label: action || '未知', color: 'bg-gray-100 text-gray-400' }
}

// 平台标签
function getPlatformInfo(platform) {
  if (platform === 'suno') return { label: 'Suno', color: 'bg-green-100 text-green-700' }
  if (platform === 'mj')   return { label: 'Midjourney', color: 'bg-purple-100 text-purple-700' }
  return { label: platform || '未知', color: 'bg-gray-100 text-gray-500' }
}

// 视频类型 action 集合
const VIDEO_ACTIONS = new Set(['generate', 'textGenerate', 'firstTailGenerate', 'referenceGenerate', 'remixGenerate'])

const PAGE_SIZES = [10, 20, 50]

// ────────────────────────────────────────────────────────────
// 弹窗组件：基础遮罩
// ────────────────────────────────────────────────────────────
function Modal({ onClose, children, maxWidth = 'max-w-2xl' }) {
  // ESC 关闭
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-card rounded-xl border border-border w-full ${maxWidth} relative`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// 弹窗：JSON 文本详情
// ────────────────────────────────────────────────────────────
function JsonModal({ content, onClose }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('已复制')
    } catch { /* noop */ }
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink">任务详情</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-cream-light text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer mr-7"
          >
            <Copy size={12} />
            复制
          </button>
        </div>
        <pre className="text-xs text-ink font-mono bg-cream-light rounded-lg border border-border p-4 overflow-auto max-h-96 whitespace-pre-wrap break-all leading-relaxed">
          {content}
        </pre>
      </div>
    </Modal>
  )
}

// ────────────────────────────────────────────────────────────
// 弹窗：视频预览
// ────────────────────────────────────────────────────────────
function VideoModal({ url, onClose }) {
  const [error, setError] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('链接已复制')
    } catch { /* noop */ }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-5">
        <p className="text-sm font-medium text-ink mb-3">视频预览</p>
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-ink-muted text-sm">
            <p>视频无法加载（可能受跨域或防盗链限制）</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-cream-light text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <Copy size={12} />
                复制链接
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-cream-light text-xs text-ink-muted hover:text-ink transition-colors no-underline"
              >
                <ExternalLink size={12} />
                在新标签页中打开
              </a>
            </div>
          </div>
        ) : (
          <video
            controls
            src={url}
            className="w-full rounded-lg"
            style={{ maxHeight: '70vh' }}
            onError={() => setError(true)}
          />
        )}
      </div>
    </Modal>
  )
}

// ────────────────────────────────────────────────────────────
// 弹窗：音乐预览（Suno 专用）
// ────────────────────────────────────────────────────────────
function AudioClipCard({ clip }) {
  const [audioError, setAudioError] = useState(false)
  const audioUrl = clip.audio_url || clip.url || ''
  const title = clip.title || clip.metadata?.title || '未命名'
  const tags = clip.tags || clip.metadata?.tags || ''
  const imageUrl = clip.image_url || clip.metadata?.image_url || ''
  const duration = clip.metadata?.duration

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(audioUrl)
      toast.success('链接已复制')
    } catch { /* noop */ }
  }

  return (
    <div className="bg-cream-light rounded-xl border border-border p-4 flex gap-4">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-ink truncate">{title}</p>
          {duration && (
            <span className="text-xs text-ink-muted shrink-0">
              {Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, '0')}
            </span>
          )}
        </div>
        {tags && (
          <p className="text-xs text-ink-muted mb-2 truncate">{tags}</p>
        )}
        {audioError ? (
          <div className="flex gap-2 items-center mt-2">
            <span className="text-xs text-ink-muted">音频无法播放</span>
            <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink cursor-pointer">
              <Copy size={10} /> 复制链接
            </button>
            <a href={audioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink no-underline">
              <ExternalLink size={10} /> 新标签页
            </a>
          </div>
        ) : (
          <audio
            controls
            src={audioUrl}
            className="w-full h-9"
            onError={() => setAudioError(true)}
          />
        )}
      </div>
    </div>
  )
}

function AudioModal({ data, onClose }) {
  let clips = []
  try {
    clips = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : [])
  } catch { /* noop */ }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="p-5">
        <p className="text-sm font-medium text-ink mb-4">音乐预览</p>
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {clips.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">暂无音频内容</p>
          ) : (
            clips.map((clip, i) => <AudioClipCard key={i} clip={clip} />)
          )}
        </div>
      </div>
    </Modal>
  )
}

// ────────────────────────────────────────────────────────────
// 主组件：任务日志
// ────────────────────────────────────────────────────────────
export default function TaskLogs() {
  // 筛选条件
  const [filters, setFilters] = useState({
    startTime: todayStart(),
    endTime: nowPlusOneHour(),
    taskId: '',
  })

  // 列表数据
  const [tasks, setTasks] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [listLoading, setListLoading] = useState(false)

  // 弹窗状态
  const [jsonModal, setJsonModal] = useState(null)      // string
  const [videoModal, setVideoModal] = useState(null)    // url string
  const [audioModal, setAudioModal] = useState(null)    // data array

  // ── 拉取列表 ──────────────────────────────────────────────
  const fetchTasks = useCallback(async (f, p, ps) => {
    setListLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('p', p)
      params.set('page_size', ps)
      if (f.taskId)    params.set('task_id', f.taskId)
      if (f.startTime) params.set('start_timestamp', toUnixSec(f.startTime))
      if (f.endTime)   params.set('end_timestamp', toUnixSec(f.endTime))

      const data = await api.get(`/api/task/self?${params}`)
      if (data?.success) {
        const items = data.data?.items ?? data.data ?? []
        setTasks(Array.isArray(items) ? items : [])
        setTotal(data.data?.total ?? 0)
      }
    } catch {
      setTasks([])
    } finally {
      setListLoading(false)
    }
  }, [])

  // ── 首次加载 ───────────────────────────────────────────────
  useEffect(() => {
    fetchTasks(filters, 1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 查询 / 重置 / 翻页 ────────────────────────────────────
  const handleSearch = () => {
    setPage(1)
    fetchTasks(filters, 1, pageSize)
  }

  const handleReset = () => {
    const def = { startTime: todayStart(), endTime: nowPlusOneHour(), taskId: '' }
    setFilters(def)
    setPage(1)
    fetchTasks(def, 1, pageSize)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchTasks(filters, newPage, pageSize)
  }

  const handlePageSizeChange = (e) => {
    const ps = Number(e.target.value)
    setPageSize(ps)
    setPage(1)
    fetchTasks(filters, 1, ps)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // ── 详情列逻辑 ────────────────────────────────────────────
  function renderDetail(task) {
    // 尝试解析 data 字段
    let dataArr = []
    try {
      dataArr = Array.isArray(task.data) ? task.data
        : (task.data ? JSON.parse(task.data) : [])
    } catch { /* noop */ }

    const hasSunoAudio = task.platform === 'suno'
      && task.status === 'SUCCESS'
      && dataArr.some(c => c.audio_url || c.url)

    const hasVideo = VIDEO_ACTIONS.has(task.action)
      && task.status === 'SUCCESS'
      && task.result_url
      && /^https?:\/\//.test(task.result_url)

    if (hasSunoAudio) {
      return (
        <button
          onClick={() => setAudioModal(dataArr)}
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer underline underline-offset-2 whitespace-nowrap"
        >
          预览音乐
        </button>
      )
    }
    if (hasVideo) {
      return (
        <button
          onClick={() => setVideoModal(task.result_url)}
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer underline underline-offset-2 whitespace-nowrap"
        >
          预览视频
        </button>
      )
    }
    if (task.fail_reason) {
      return (
        <button
          onClick={() => setJsonModal(task.fail_reason)}
          className="text-xs text-ink-muted hover:text-ink cursor-pointer text-left max-w-[100px] truncate block"
          title={task.fail_reason}
        >
          {task.fail_reason}
        </button>
      )
    }
    return <span className="text-ink-faint">—</span>
  }

  // ── 花费时间渲染 ──────────────────────────────────────────
  function renderDuration(task) {
    if (!task.finish_time || !task.submit_time) return <span className="text-ink-faint">—</span>
    const sec = task.finish_time - task.submit_time
    const color = sec <= 60 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    return (
      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
        {sec}s
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <ListTodo size={16} className="text-orange-500" />
        <h2 className="text-base font-medium text-ink">任务日志</h2>
      </div>

      {/* ── 筛选区 ── */}
      <div className="bg-cream-light rounded-xl border border-border p-4 mb-4 space-y-3">
        {/* 时间范围 */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-ink-muted shrink-0">开始时间</label>
            <input
              type="datetime-local"
              value={filters.startTime}
              onChange={e => setFilters(f => ({ ...f, startTime: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted"
            />
          </div>
          <span className="text-ink-muted text-xs">—</span>
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs text-ink-muted shrink-0">结束时间</label>
            <input
              type="datetime-local"
              value={filters.endTime}
              onChange={e => setFilters(f => ({ ...f, endTime: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted"
            />
          </div>
        </div>

        {/* 任务 ID + 按钮 */}
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="任务 ID (task_xxxx)"
            value={filters.taskId}
            onChange={e => setFilters(f => ({ ...f, taskId: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-52 px-3 py-2 rounded-lg border border-border bg-card text-ink text-xs outline-none focus:border-ink-muted placeholder:text-ink-faint"
          />
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-ink-muted text-xs hover:text-ink hover:bg-cream-dark transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              重置
            </button>
            <button
              onClick={handleSearch}
              disabled={listLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors disabled:opacity-50"
            >
              <Search size={12} />
              查询
            </button>
          </div>
        </div>
      </div>

      {/* ── 任务列表表格 ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        {listLoading ? (
          <div className="py-16 text-center text-sm text-ink-muted">
            <div className="inline-block w-5 h-5 border-2 border-ink-faint border-t-ink rounded-full animate-spin mb-3" />
            <p>加载中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center">
            <ListTodo size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">暂无任务记录</p>
            <p className="text-xs text-ink-faint mt-1">调整筛选条件后重新查询</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-cream-light border-b border-border">
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">提交时间</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">结束时间</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">花费时间</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">平台</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">类型</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">任务 ID</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">状态</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">进度</th>
                <th className="px-4 py-3 text-left text-ink-muted font-medium whitespace-nowrap">详情</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => {
                const statusInfo  = getStatusInfo(task.status)
                const actionInfo  = getActionInfo(task.action)
                const platformInfo = getPlatformInfo(task.platform)

                return (
                  <tr key={task.id ?? idx} className="border-b border-border hover:bg-cream-light/60 transition-colors">
                    {/* 提交时间 */}
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatTime(task.submit_time)}</td>

                    {/* 结束时间 */}
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatTime(task.finish_time)}</td>

                    {/* 花费时间 */}
                    <td className="px-4 py-3 whitespace-nowrap">{renderDuration(task)}</td>

                    {/* 平台 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${platformInfo.color}`}>
                        {platformInfo.label}
                      </span>
                    </td>

                    {/* 类型 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                    </td>

                    {/* 任务 ID — 点击查看完整 JSON */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setJsonModal(JSON.stringify(task, null, 2))}
                        className="font-mono text-xs text-ink-muted hover:text-ink cursor-pointer max-w-[120px] truncate block underline underline-offset-2 decoration-dotted"
                        title={task.task_id}
                      >
                        {task.task_id || '—'}
                      </button>
                    </td>

                    {/* 任务状态 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* 进度 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {task.progress ? (
                        <span className={`text-xs font-mono ${task.status === 'FAILURE' ? 'text-red-500' : 'text-ink'}`}>
                          {task.progress}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>

                    {/* 详情 */}
                    <td className="px-4 py-3">{renderDetail(task)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 分页 ── */}
      {!listLoading && tasks.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <span>共 {total} 条</span>
            <span className="text-ink-faint">·</span>
            <span>每页</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-2 py-1 rounded-lg border border-border bg-card text-ink text-xs outline-none cursor-pointer"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>条</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-3 py-1 rounded-lg bg-cream-dark text-ink font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── 弹窗 ── */}
      {jsonModal  && <JsonModal  content={jsonModal}  onClose={() => setJsonModal(null)}  />}
      {videoModal && <VideoModal url={videoModal}     onClose={() => setVideoModal(null)} />}
      {audioModal && <AudioModal data={audioModal}    onClose={() => setAudioModal(null)} />}
    </div>
  )
}
