import { useState } from 'react'
import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ArrowLeft, SlidersHorizontal, BarChart3, Wallet, Bell, Building2, ScrollText, ListTodo } from 'lucide-react'
import UsageLogs from './account/UsageLogs'
import TaskLogs from './account/TaskLogs'
import UsageStats from './account/UsageStats'
import PersonalSettings from './account/PersonalSettings'
import WalletPage from './account/WalletPage'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'



function NotificationCenter() {
  return (
    <div>
      <h2 className="text-base font-medium text-ink mb-6">通知中心</h2>
      <div className="text-center py-12">
        <Bell size={28} className="text-ink-faint mx-auto mb-3" />
        <p className="text-sm text-ink-muted">暂无通知</p>
        <p className="text-xs text-ink-faint mt-1">系统公告、额度预警等通知将显示在这里</p>
      </div>
    </div>
  )
}



function EnterpriseManagement() {
  return (
    <div>
      <h2 className="text-base font-medium text-ink mb-6">企业账号管理</h2>
      <div className="text-center py-12">
        <Building2 size={28} className="text-ink-faint mx-auto mb-3" />
        <p className="text-sm text-ink-muted">企业版功能即将上线</p>
        <p className="text-xs text-ink-faint mt-1 max-w-xs mx-auto">
          支持团队成员管理、统一账单、用量分析等企业级功能，敬请期待
        </p>
        <a
          href="mailto:support@metahub-ai.com"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-cream-dark text-ink text-sm no-underline hover:bg-cream-dark/80 transition-colors"
        >
          联系我们了解详情
        </a>
      </div>
    </div>
  )
}


const navItems = [
  { path: 'usage',       label: '用量统计',    icon: BarChart3         },
  { path: 'wallet',      label: '钱包管理',    icon: Wallet            },
  { path: 'notifications', label: '通知中心', icon: Bell              },
  { path: 'enterprise',  label: '企业账号管理', icon: Building2        },
  { path: 'logs',        label: '使用日志',   icon: ScrollText        },
  { path: 'task-logs',   label: '任务日志',   icon: ListTodo          },
  { path: 'settings',    label: '个人设置',   icon: SlidersHorizontal },
]

export default function AccountPage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-cream">
      <div className="sticky top-0 z-10 bg-cream-light/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/chat" className="text-ink-muted hover:text-ink transition-colors no-underline flex items-center gap-1 text-sm">
            <ArrowLeft size={16} />
            返回
          </Link>
          <h1 className="text-base font-medium text-ink">账号管理</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 flex gap-8">
        {/* 左侧导航 */}
        <div className="w-48 shrink-0">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-full bg-ink text-cream-light flex items-center justify-center text-sm font-medium">
              {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <p className="text-sm font-medium text-ink mt-2">{user?.display_name || user?.username || '用户'}</p>
            <p className="text-xs text-ink-muted">{user?.email || ''}</p>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={`/account/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm no-underline transition-colors ${
                    isActive ? 'bg-cream-dark text-ink font-medium' : 'text-ink-muted hover:text-ink hover:bg-cream-dark/50'
                  }`
                }
              >
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 bg-card rounded-xl border border-border p-6">
          <Routes>
            <Route index element={<Navigate to="usage" replace />} />
            <Route path="usage" element={<UsageStats />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="enterprise" element={<EnterpriseManagement />} />
            <Route path="logs" element={<UsageLogs />} />
            <Route path="task-logs" element={<TaskLogs />} />
            <Route path="settings" element={<PersonalSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
