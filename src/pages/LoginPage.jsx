import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/chat'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('请填写邮箱和密码')
      return
    }
    const result = await login(email, password)
    if (result.success) {
      toast.success('登录成功')
      navigate(from, { replace: true })
    } else {
      toast.error(result.error || '登录失败')
    }
  }

  const handleGoogleLogin = () => {
    // TODO: Google OAuth 需要后端配置 OIDC Client ID/Secret
    toast('Google 登录即将推出，请先使用邮箱登录', { icon: '🔜' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block no-underline">
            <h1 className="font-serif text-2xl italic text-ink">元枢 AI</h1>
          </Link>
          <p className="text-ink-muted text-sm mt-2">一站式 AI 模型聚合平台</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-xl bg-card hover:bg-cream text-ink text-sm font-medium cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            使用 Google 账号登录
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-ink-muted text-xs">或</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email + Password */}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-ink-muted">密码</label>
                <Link to="/reset-password" className="text-xs text-accent hover:text-accent-hover no-underline">
                  忘记密码？
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-cream-light text-ink text-sm outline-none focus:border-ink-muted transition-colors pr-10"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-ink text-cream-light text-sm font-medium cursor-pointer hover:bg-ink-light transition-colors border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-muted mt-6">
            还没有账号？{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover no-underline font-medium">
              立即注册
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-ink-faint mt-6">
          登录即代表同意《服务条款》和《隐私政策》
        </p>
      </div>
    </div>
  )
}
