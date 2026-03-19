import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      toast.error('请填写所有字段')
      return
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (password.length < 8) {
      toast.error('密码至少需要8个字符')
      return
    }

    // new-api 注册使用 username（用邮箱作为 username）
    const result = await register(email, password, email)
    if (result.success) {
      toast.success('注册成功！')
      navigate('/chat', { replace: true })
    } else {
      toast.error(result.error || '注册失败')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block no-underline">
            <h1 className="font-serif text-2xl italic text-ink">元枢 AI</h1>
          </Link>
          <p className="text-ink-muted text-sm mt-2">创建你的账号</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少8个字符"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer p-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1.5">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-ink text-cream-light text-sm font-medium cursor-pointer hover:bg-ink-light transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-muted mt-6">
            已有账号？{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover no-underline font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
