import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key,
  Lock,
  Shield,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Pencil,
  Mail,
  MessageCircle,
  Github,
  Gamepad2,
  ShieldCheck,
  Send,
  Terminal,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

// ─── 额度显示 ───────────────────────────────────────────────────────────────
function renderQuota(q) {
  if (q == null) return "$0.00";
  return `$${(q / 500000).toFixed(2)}`;
}

function getRoleLabel(role) {
  if (role === 100)
    return { label: "超级管理员", color: "bg-red-100 text-red-700" };
  if (role >= 10)
    return { label: "管理员", color: "bg-amber-100 text-amber-700" };
  return { label: "普通用户", color: "bg-blue-100 text-blue-700" };
}

// ─── 通用 Modal ──────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-medium text-ink">{title}</span>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl leading-none cursor-pointer border-none bg-transparent"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── 修改密码弹窗 ────────────────────────────────────────────────────────────
function ChangePasswordModal({ open, onClose }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newPwd) {
      toast.error("新密码不能为空");
      return;
    }
    if (newPwd === oldPwd && oldPwd !== "") {
      toast.error("新密码不能与原密码相同");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("两次密码不一致");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/user/self", {
        original_password: oldPwd,
        password: newPwd,
      });
      toast.success("密码修改成功");
      onClose();
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      toast.error(err.message || "修改失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="修改密码">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">
            原密码（OAuth 注册可留空）
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted pr-10"
              placeholder="留空表示未设置密码"
            />
            <button
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer border-none bg-transparent"
            >
              {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">新密码</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted pr-10"
              placeholder="输入新密码"
            />
            <button
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink cursor-pointer border-none bg-transparent"
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">
            确认新密码
          </label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted"
            placeholder="再次输入新密码"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
          >
            {saving ? "保存中..." : "确认修改"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── 删除账户弹窗 ─────────────────────────────────────────────────────────────
function DeleteAccountModal({ open, onClose, username }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [inputName, setInputName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (inputName !== username) {
      toast.error("用户名不匹配");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/api/user/self");
      toast.success("账号已删除");
      logout();
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "删除失败");
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="删除账户">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium mb-1">⚠️ 危险操作</p>
          <p className="text-xs text-red-600">
            您正在删除自己的账户，将清空所有数据且不可恢复，请谨慎操作。
          </p>
        </div>
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">
            请输入用户名{" "}
            <span className="font-mono font-medium text-ink">{username}</span>{" "}
            以确认
          </label>
          <input
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-red-300"
            placeholder="输入用户名"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || inputName !== username}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-red-700 transition-colors"
          >
            {deleting ? "删除中..." : "确认删除"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── 修改显示名称弹窗 ─────────────────────────────────────────────────────────
function EditDisplayNameModal({ open, onClose, currentName, onSaved }) {
  const [name, setName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("名称不能为空");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/user/self", { display_name: name.trim() });
      toast.success("显示名称已更新");
      onSaved(name.trim());
      onClose();
    } catch (err) {
      toast.error(err.message || "更新失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="修改显示名称">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">
            显示名称
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            maxLength={30}
            autoFocus
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted"
            placeholder="输入你的显示名称"
          />
          <p className="text-xs text-ink-faint mt-1.5">
            仅修改显示名称，不影响邮箱、账号登录凭据
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
          >
            {saving ? "保存中..." : "确认修改"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── 顶部用户信息卡片 ──────────────────────────────────────────────────────────
function UserInfoHeader({ user }) {
  const roleInfo = getRoleLabel(user?.role || 1);
  const avatarLetters = (user?.display_name || user?.username || "U")
    .slice(0, 2)
    .toUpperCase();
  const [localName, setLocalName] = useState(
    user?.display_name || user?.username || "用户",
  );
  const [showEditName, setShowEditName] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-5">
      {/* 用户信息区 */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-ink text-cream-light flex items-center justify-center text-base font-bold shrink-0">
          {avatarLetters}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-ink">
              {localName}
            </span>
            <button
              onClick={() => setShowEditName(true)}
              className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-cream-dark bg-transparent border-none cursor-pointer transition-colors"
              title="修改显示名称"
            >
              <Pencil size={13} />
            </button>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleInfo.color}`}
            >
              {roleInfo.label}
            </span>
            <span className="text-xs text-ink-faint">ID: {user?.id}</span>
          </div>
          {user?.email && (
            <p className="text-xs text-ink-muted mt-0.5 truncate">
              {user.email}
            </p>
          )}
        </div>
      </div>
      <EditDisplayNameModal
        open={showEditName}
        onClose={() => setShowEditName(false)}
        currentName={localName}
        onSaved={setLocalName}
      />
      {/* 统计数据 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "当前余额", value: renderQuota(user?.quota), badge: true },
          { label: "历史消耗", value: renderQuota(user?.used_quota) },
          {
            label: "请求次数",
            value: (user?.request_count || 0).toLocaleString(),
          },
          { label: "用户分组", value: user?.group || "默认" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-cream-light rounded-xl p-3 border border-border"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-ink-muted">{stat.label}</span>
              {stat.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-medium">
                  余额
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-ink">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 签到日历 ─────────────────────────────────────────────────────────────────
function CheckinCalendar() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkedToday, setCheckedToday] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadRecords = useCallback(async (month) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/user/checkin?month=${month}`);
      const data = res.data || {};
      const recs = data.records || [];
      setRecords(recs);
      const today = new Date().toISOString().slice(0, 10);
      const isCheckedToday = recs.some((r) => r.checkin_date === today);
      setCheckedToday(isCheckedToday);
      setCollapsed(isCheckedToday);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords(currentMonth);
  }, [currentMonth, loadRecords]);

  const handleCheckin = async () => {
    try {
      const res = await api.post("/api/user/checkin", {});
      const quota = res.data?.quota_awarded;
      toast.success(`签到成功！获得 ${renderQuota(quota)}`);
      await loadRecords(currentMonth);
    } catch (err) {
      toast.error(err.message || "签到失败");
    }
  };

  const monthRecords = records.filter((r) =>
    r.checkin_date?.startsWith(currentMonth),
  );
  const monthTotal = monthRecords.reduce(
    (acc, r) => acc + (r.quota_awarded || 0),
    0,
  );

  const [year, month] = currentMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const checkedDates = new Set(records.map((r) => r.checkin_date));

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-ink">每日签到</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            本月签到 {monthRecords.length} 次 · 获得 {renderQuota(monthTotal)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckin}
            disabled={checkedToday || loading}
            className="px-3 py-1.5 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
          >
            {checkedToday ? "✓ 已签到" : "签到"}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-ink-muted hover:text-ink cursor-pointer border-none bg-transparent p-1"
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          {/* 月份切换 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="text-xs text-ink-muted hover:text-ink cursor-pointer border-none bg-transparent px-2 py-1 rounded-lg hover:bg-cream-dark"
            >
              ‹ 上月
            </button>
            <span className="text-xs font-medium text-ink">
              {year} 年 {month} 月
            </span>
            <button
              onClick={nextMonth}
              className="text-xs text-ink-muted hover:text-ink cursor-pointer border-none bg-transparent px-2 py-1 rounded-lg hover:bg-cream-dark"
            >
              下月 ›
            </button>
          </div>
          {/* 日历格 */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} className="text-[11px] text-ink-faint py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
              const checked = checkedDates.has(dateStr);
              const rec = records.find((r) => r.checkin_date === dateStr);
              return (
                <div
                  key={day}
                  className="flex flex-col items-center py-0.5"
                  title={
                    checked ? `获得 ${renderQuota(rec?.quota_awarded)}` : ""
                  }
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      checked
                        ? "bg-emerald-500 text-white"
                        : "text-ink-muted hover:bg-cream-dark"
                    }`}
                  >
                    {day}
                  </span>
                  {checked && rec?.quota_awarded > 0 && (
                    <span className="text-[9px] text-emerald-600 mt-0.5 leading-none">
                      {renderQuota(rec.quota_awarded)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 账户绑定 Tab ──────────────────────────────────────────────────────────────
function AccountBindings({ user, status }) {
  const platforms = [
    {
      key: "email",
      label: "邮箱",
      Icon: Mail,
      value: user?.email,
      enabled: true,
    },
    {
      key: "wechat",
      label: "微信",
      Icon: MessageCircle,
      value: user?.wechat_id,
      enabled: !!status?.wechat_login,
    },
    {
      key: "github",
      label: "GitHub",
      Icon: Github,
      value: user?.github_id,
      enabled: !!status?.github_oauth,
    },
    {
      key: "discord",
      label: "Discord",
      Icon: Gamepad2,
      value: user?.discord_id,
      enabled: !!status?.discord_oauth,
    },
    {
      key: "oidc",
      label: "OIDC",
      Icon: ShieldCheck,
      value: user?.oidc_id,
      enabled: !!status?.oidc_enabled,
    },
    {
      key: "telegram",
      label: "Telegram",
      Icon: Send,
      value: user?.telegram_id,
      enabled: !!status?.telegram_oauth,
    },
    {
      key: "linux_do",
      label: "LinuxDO",
      Icon: Terminal,
      value: user?.linux_do_id,
      enabled: !!status?.linuxdo_oauth,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {platforms.map((p) => (
        <div
          key={p.key}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-cream-light border border-border"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
              <p.Icon size={14} className="text-ink-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink">{p.label}</p>
              <p className="text-xs text-ink-muted mt-0.5 truncate">
                {!p.enabled
                  ? "未启用"
                  : p.value
                    ? p.key === "email"
                      ? p.value
                      : `ID: ${String(p.value).slice(0, 14)}`
                    : "未绑定"}
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-2">
            {p.enabled && p.value && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle size={12} /> 已绑
              </span>
            )}
            {p.enabled && !p.value && (
              <button className="text-xs px-2.5 py-1 rounded-lg border border-border bg-card text-ink-muted hover:bg-cream-dark cursor-pointer transition-colors">
                绑定
              </button>
            )}
            {!p.enabled && (
              <span className="text-xs text-ink-faint">未启用</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 两步验证 ──────────────────────────────────────────────────────────────────
function TwoFASection() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=view, 1=qr, 2=code, 3=backup
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    api
      .get("/api/user/2fa/status")
      .then((res) => setStatus(res.data))
      .catch(() => {});
  }, []);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/user/2fa/setup", {});
      setSetupData(res.data);
      setStep(1);
    } catch (err) {
      toast.error(err.message || "初始化失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!code || code.length !== 6) {
      toast.error("请输入 6 位验证码");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/user/2fa/enable", { code });
      setBackupCodes(res.data?.backup_codes || []);
      setStep(3);
      setStatus((prev) => ({ ...prev, enabled: true }));
    } catch (err) {
      toast.error(err.message || "验证码错误，启用失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode) {
      toast.error("请输入验证码");
      return;
    }
    if (!agreed) {
      toast.error("请勾选确认");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/user/2fa/disable", { code: disableCode });
      toast.success("2FA 已禁用");
      setStatus((prev) => ({ ...prev, enabled: false }));
      setShowDisable(false);
      setDisableCode("");
      setAgreed(false);
    } catch (err) {
      toast.error(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  if (status === null) {
    return <div className="text-xs text-ink-muted">加载中…</div>;
  }

  // Step 1: QR 码
  if (step === 1 && setupData) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">
          请使用 Google Authenticator / Authy 等应用扫描二维码：
        </p>
        <div className="bg-cream-light rounded-xl p-4 flex flex-col items-center gap-3 border border-border">
          {setupData.setup_url && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setupData.setup_url)}`}
              alt="2FA QR Code"
              className="w-32 h-32 rounded"
            />
          )}
          {setupData.secret && (
            <div className="text-center">
              <p className="text-xs text-ink-muted mb-1">或手动输入密钥：</p>
              <p className="font-mono text-sm text-ink tracking-wider">
                {setupData.secret}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep(0)}
            className="flex-1 px-3 py-2 rounded-lg text-xs text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => setStep(2)}
            className="flex-1 px-3 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer"
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  // Step 2: 输入验证码
  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">
          请输入 Authenticator App 中显示的 6 位验证码：
        </p>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          maxLength={6}
          className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted font-mono tracking-widest text-center"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setStep(1)}
            className="flex-1 px-3 py-2 rounded-lg text-xs text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer"
          >
            返回
          </button>
          <button
            onClick={handleEnable}
            disabled={loading || code.length !== 6}
            className="flex-1 px-3 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer disabled:opacity-50"
          >
            {loading ? "验证中..." : "验证并启用"}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: 备用码
  if (step === 3) {
    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ 请立即保存以下备用码，每个只能使用一次，丢失后无法找回
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((c, i) => (
            <code
              key={i}
              className="px-3 py-1.5 rounded-lg bg-cream-light border border-border text-xs font-mono text-ink text-center"
            >
              {c}
            </code>
          ))}
        </div>
        <button
          onClick={() => setStep(0)}
          className="w-full px-3 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer"
        >
          完成
        </button>
      </div>
    );
  }

  // 默认视图
  return (
    <div className="space-y-3">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${status.enabled ? "bg-emerald-50 border-emerald-200" : "bg-cream-light border-border"}`}
      >
        <Shield
          size={13}
          className={status.enabled ? "text-emerald-600" : "text-ink-muted"}
        />
        <span className="text-xs text-ink flex-1">
          {status.enabled ? "两步验证已启用" : "两步验证未启用"}
        </span>
        {status.enabled && status.backup_codes_count != null && (
          <span className="text-xs text-ink-muted">
            剩余 {status.backup_codes_count} 个备用码
          </span>
        )}
      </div>
      {!status.enabled ? (
        <button
          onClick={handleSetup}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
        >
          {loading ? "初始化中..." : "设置 2FA"}
        </button>
      ) : (
        <div className="space-y-2">
          {!showDisable ? (
            <button
              onClick={() => setShowDisable(true)}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50 cursor-pointer transition-colors bg-transparent"
            >
              禁用 2FA
            </button>
          ) : (
            <div className="space-y-2 p-3 bg-cream-light rounded-xl border border-border">
              <p className="text-xs text-ink-muted">
                输入当前验证码或备用码以禁用：
              </p>
              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="输入验证码"
                className="w-full border border-border rounded-xl px-4 py-2 bg-card text-ink text-sm outline-none focus:border-ink-muted"
              />
              <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="rounded"
                />
                我了解禁用 2FA 后账户安全性将降低
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode("");
                    setAgreed(false);
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs text-ink-muted border border-border bg-card hover:bg-cream-dark cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs border-none cursor-pointer disabled:opacity-50 hover:bg-red-700"
                >
                  {loading ? "处理中..." : "确认禁用"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 安全设置 Tab ──────────────────────────────────────────────────────────────
function SecuritySettingsTab({ user }) {
  const [systemToken, setSystemToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    api
      .get("/api/user/passkey")
      .then((res) => setPasskeyStatus(res.data))
      .catch(() => {});
  }, []);

  const handleGenerateToken = async () => {
    setTokenLoading(true);
    try {
      const res = await api.get("/api/user/token");
      const token = res.data?.token || res.data || "";
      setSystemToken(token);
      if (token) {
        await navigator.clipboard.writeText(token);
        toast.success("令牌已生成并复制到剪贴板");
      }
    } catch (err) {
      toast.error(err.message || "生成失败");
    } finally {
      setTokenLoading(false);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(systemToken);
      toast.success("已复制");
    } catch {}
  };

  const handlePasskeyDelete = async () => {
    if (!window.confirm("确定要解绑 Passkey 吗？")) return;
    setPasskeyLoading(true);
    try {
      await api.delete("/api/user/passkey");
      setPasskeyStatus({ enabled: false });
      toast.success("Passkey 已解绑");
    } catch (err) {
      toast.error(err.message || "操作失败");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const passkeySupported =
    typeof window !== "undefined" && !!window.PublicKeyCredential;

  return (
    <div className="space-y-3">
      {/* 系统访问令牌 */}
      <div className="px-4 py-3 rounded-xl bg-cream-light border border-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
            <Key size={14} className="text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">系统访问令牌</p>
            <p className="text-xs text-ink-muted mt-0.5 mb-2">
              用于直接调用 API 的身份验证令牌
            </p>
            {systemToken && (
              <div className="flex gap-2 mb-2">
                <input
                  value={systemToken}
                  readOnly
                  onClick={handleCopyToken}
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-card text-ink text-xs outline-none font-mono cursor-pointer hover:border-ink-muted"
                />
                <button
                  onClick={handleCopyToken}
                  className="text-ink-muted hover:text-ink cursor-pointer border-none bg-transparent p-1"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
            <button
              onClick={handleGenerateToken}
              disabled={tokenLoading}
              className="px-3 py-1.5 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
            >
              {tokenLoading
                ? "生成中..."
                : systemToken
                  ? "重新生成"
                  : "生成令牌"}
            </button>
          </div>
        </div>
      </div>

      {/* 密码管理 */}
      <div className="px-4 py-3 rounded-xl bg-cream-light border border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
            <Lock size={14} className="text-ink-muted" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">密码管理</p>
            <p className="text-xs text-ink-muted mt-0.5">
              定期更改密码可以提升账户安全性
            </p>
          </div>
          <button
            onClick={() => setShowChangePwd(true)}
            className="px-3 py-1.5 rounded-lg border border-border text-ink-muted text-xs hover:bg-cream-dark cursor-pointer transition-colors bg-transparent shrink-0"
          >
            修改密码
          </button>
        </div>
      </div>

      {/* Passkey */}
      {/* <div className="px-4 py-3 rounded-xl bg-cream-light border border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
            <Key size={14} className="text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">Passkey 登录</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {passkeyStatus?.enabled && passkeyStatus?.last_used_at
                ? `最后使用：${new Date(passkeyStatus.last_used_at).toLocaleDateString()}`
                : passkeyStatus?.enabled
                  ? '已注册'
                  : !passkeySupported
                    ? '当前设备不支持 Passkey'
                    : '使用生物识别或安全密钥登录'}
            </p>
          </div>
          <button
            onClick={passkeyStatus?.enabled ? handlePasskeyDelete : undefined}
            disabled={passkeyLoading || (!passkeyStatus?.enabled && !passkeySupported)}
            className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors shrink-0 ${
              passkeyStatus?.enabled
                ? 'border-red-200 text-red-600 hover:bg-red-50 bg-transparent'
                : 'border-border text-ink-muted hover:bg-cream-dark bg-transparent'
            } disabled:opacity-40`}
          >
            {passkeyStatus?.enabled
              ? (passkeyLoading ? '处理中...' : '解绑 Passkey')
              : '注册 Passkey'}
          </button>
        </div>
      </div> */}

      {/* 两步验证 */}
      {/* <div className="px-4 py-3 rounded-xl bg-cream-light border border-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
            <Shield size={14} className="text-ink-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">两步验证（2FA）</p>
            <p className="text-xs text-ink-muted mt-0.5 mb-3">使用 Authenticator App 进一步增强账户安全</p>
            <TwoFASection />
          </div>
        </div>
      </div> */}

      {/* 危险区域 */}
      <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">删除账户</p>
            <p className="text-xs text-red-500 mt-0.5">
              所有数据将永久删除，不可恢复
            </p>
          </div>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs hover:bg-red-100 cursor-pointer transition-colors bg-transparent shrink-0"
          >
            删除账户
          </button>
        </div>
      </div>

      <ChangePasswordModal
        open={showChangePwd}
        onClose={() => setShowChangePwd(false)}
      />
      <DeleteAccountModal
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        username={user?.username}
      />
    </div>
  );
}

// ─── 账户管理卡片 ─────────────────────────────────────────────────────────────
function AccountManagement({ user, status }) {
  const [activeTab, setActiveTab] = useState("security");
  const tabs = [
    // { key: "bindings", label: "账户绑定" },
    { key: "security", label: "安全设置" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-5">
      <h3 className="text-sm font-medium text-ink mb-4">账户管理</h3>
      <div className="bg-cream-light rounded-lg p-1 flex gap-1 mb-4 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${
              activeTab === tab.key
                ? "bg-card text-ink shadow-sm"
                : "text-ink-muted hover:text-ink bg-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "bindings" ? (
        <AccountBindings user={user} status={status} />
      ) : (
        <SecuritySettingsTab user={user} />
      )}
    </div>
  );
}

// ─── 偏好设置卡片 ─────────────────────────────────────────────────────────────
function PreferencesCard({ user }) {
  const languages = [
    { value: "zh-Hans", label: "简体中文" },
    { value: "zh-Hant", label: "繁體中文" },
    { value: "en", label: "English" },
    // { value: "fr", label: "Français" },
    // { value: "ru", label: "Русский" },
    // { value: "ja", label: "日本語" },
    // { value: "vi", label: "Tiếng Việt" },
  ];

  const getInitialLang = () => {
    try {
      const setting =
        typeof user?.setting === "string"
          ? JSON.parse(user.setting)
          : user?.setting || {};
      return (
        setting.Language || localStorage.getItem("i18nextLng") || "zh-Hans"
      );
    } catch {
      return "zh-Hans";
    }
  };

  const [currentLang, setCurrentLang] = useState(getInitialLang);
  const [saving, setSaving] = useState(false);

  const handleLangChange = async (lang) => {
    const prev = currentLang;
    setCurrentLang(lang);
    localStorage.setItem("i18nextLng", lang);
    setSaving(true);
    try {
      await api.put("/api/user/self", { language: lang });
    } catch {
      toast.error("语言保存失败，已回退");
      setCurrentLang(prev);
      localStorage.setItem("i18nextLng", prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink">偏好设置</h3>
        {saving && <span className="text-xs text-ink-muted">保存中...</span>}
      </div>
      <div>
        <label className="block text-xs text-ink-muted mb-2">语言偏好</label>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => handleLangChange(lang.value)}
              className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                currentLang === lang.value
                  ? "bg-ink text-cream-light border-ink"
                  : "text-ink-muted border-border bg-cream-light hover:bg-cream-dark"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 其他设置卡片 ─────────────────────────────────────────────────────────────
function OtherSettingsCard({ user }) {
  const getInitialForm = () => {
    try {
      const setting =
        typeof user?.setting === "string"
          ? JSON.parse(user.setting)
          : user?.setting || {};
      return {
        notify_type: setting.notify_type || "email",
        quota_warning_threshold:
          (setting.quota_warning_threshold || 500000) / 500000,
        notification_email: setting.notification_email || "",
        webhook_url: setting.webhook_url || "",
        webhook_secret: setting.webhook_secret || "",
        bark_url: setting.bark_url || "",
        gotify_url: setting.gotify_url || "",
        gotify_token: setting.gotify_token || "",
        gotify_priority: setting.gotify_priority ?? 5,
        accept_unset_model_ratio_model:
          !!setting.accept_unset_model_ratio_model,
        record_ip_log: !!setting.record_ip_log,
      };
    } catch {
      return {
        notify_type: "email",
        quota_warning_threshold: 1,
        notification_email: "",
        webhook_url: "",
        webhook_secret: "",
        bark_url: "",
        gotify_url: "",
        gotify_token: "",
        gotify_priority: 5,
        accept_unset_model_ratio_model: false,
        record_ip_log: false,
      };
    }
  };

  const [form, setForm] = useState(getInitialForm);
  const [activeTab, setActiveTab] = useState("notify");
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/user/setting", {
        ...form,
        quota_warning_threshold: Math.round(
          form.quota_warning_threshold * 500000,
        ),
      });
      toast.success("设置已保存");
    } catch (err) {
      toast.error(err.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "notify", label: "通知配置" },
    { key: "price", label: "价格设置" },
    { key: "privacy", label: "隐私设置" },
  ];

  const notifyTypes = [
    { value: "email", label: "邮件" },
    // { value: "webhook", label: "Webhook" },
    // { value: "bark", label: "Bark" },
    // { value: "gotify", label: "Gotify" },
  ];

  const thresholdPresets = [
    { label: "$0.2", v: 0.2 },
    { label: "$1", v: 1 },
    { label: "$2", v: 2 },
    { label: "$10", v: 10 },
  ];

  const inputCls =
    "w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted";

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors cursor-pointer border-none relative shrink-0 ${checked ? "bg-ink" : "bg-cream-dark"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "left-5" : "left-0.5"}`}
      />
    </button>
  );

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-ink">其他设置</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          通知、价格和隐私相关设置
        </p>
      </div>

      <div className="bg-cream-light rounded-lg p-1 flex gap-1 mb-5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${
              activeTab === tab.key
                ? "bg-card text-ink shadow-sm"
                : "text-ink-muted hover:text-ink bg-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 通知配置 */}
      {activeTab === "notify" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-ink-muted mb-2">
              通知方式
            </label>
            <div className="flex gap-2 flex-wrap">
              {notifyTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update("notify_type", t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                    form.notify_type === t.value
                      ? "bg-ink text-cream-light border-ink"
                      : "text-ink-muted border-border bg-cream-light hover:bg-cream-dark"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-muted mb-2">
              额度预警阈值（USD）
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {thresholdPresets.map((p) => (
                <button
                  key={p.v}
                  onClick={() => update("quota_warning_threshold", p.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                    form.quota_warning_threshold === p.v
                      ? "bg-ink text-cream-light border-ink"
                      : "text-ink-muted border-border bg-cream-light hover:bg-cream-dark"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={form.quota_warning_threshold}
              min="0"
              step="0.1"
              onChange={(e) =>
                update(
                  "quota_warning_threshold",
                  parseFloat(e.target.value) || 0,
                )
              }
              className={inputCls}
              placeholder="自定义阈值"
            />
          </div>

          {form.notify_type === "email" && (
            <div>
              <label className="block text-xs text-ink-muted mb-2">
                通知邮箱（留空则使用账号邮箱）
              </label>
              <input
                type="email"
                value={form.notification_email}
                onChange={(e) => update("notification_email", e.target.value)}
                className={inputCls}
                placeholder="notification@example.com"
              />
            </div>
          )}

          {form.notify_type === "webhook" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-ink-muted mb-2">
                  Webhook 地址
                </label>
                <input
                  value={form.webhook_url}
                  onChange={(e) => update("webhook_url", e.target.value)}
                  className={inputCls}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-2">
                  接口凭证（Bearer Token，可选）
                </label>
                <input
                  value={form.webhook_secret}
                  onChange={(e) => update("webhook_secret", e.target.value)}
                  className={inputCls}
                  placeholder="可选"
                />
              </div>
            </div>
          )}

          {form.notify_type === "bark" && (
            <div>
              <label className="block text-xs text-ink-muted mb-2">
                Bark 推送 URL
              </label>
              <input
                value={form.bark_url}
                onChange={(e) => update("bark_url", e.target.value)}
                className={inputCls}
                placeholder="https://api.day.app/your-token/{{title}}/{{content}}"
              />
            </div>
          )}

          {form.notify_type === "gotify" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-ink-muted mb-2">
                  Gotify 服务器地址
                </label>
                <input
                  value={form.gotify_url}
                  onChange={(e) => update("gotify_url", e.target.value)}
                  className={inputCls}
                  placeholder="https://gotify.example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-2">
                  应用令牌
                </label>
                <input
                  value={form.gotify_token}
                  onChange={(e) => update("gotify_token", e.target.value)}
                  className={inputCls}
                  placeholder="App Token"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-2">
                  消息优先级（0-10）
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 2, 5, 8, 10].map((p) => (
                    <button
                      key={p}
                      onClick={() => update("gotify_priority", p)}
                      className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                        form.gotify_priority === p
                          ? "bg-ink text-cream-light border-ink"
                          : "text-ink-muted border-border bg-cream-light hover:bg-cream-dark"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 价格设置 */}
      {activeTab === "price" && (
        <div className="space-y-3">
          <div className="flex items-start justify-between px-4 py-3 rounded-xl bg-cream-light border border-border gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">接受未设置价格模型</p>
              <p className="text-xs text-ink-muted mt-0.5">
                开启后允许调用没有设置价格的模型（有高额费用风险）
              </p>
              {form.accept_unset_model_ratio_model && (
                <p className="text-xs text-amber-600 mt-1.5 font-medium">
                  ⚠️ 此功能有产生高额费用的风险，请谨慎使用
                </p>
              )}
            </div>
            <ToggleSwitch
              checked={form.accept_unset_model_ratio_model}
              onChange={(v) => update("accept_unset_model_ratio_model", v)}
            />
          </div>
        </div>
      )}

      {/* 隐私设置 */}
      {activeTab === "privacy" && (
        <div className="space-y-3">
          <div className="flex items-start justify-between px-4 py-3 rounded-xl bg-cream-light border border-border gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">
                记录请求与错误日志 IP
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                开启后，「消费」和「错误」类型日志将记录客户端 IP 地址
              </p>
            </div>
            <ToggleSwitch
              checked={form.record_ip_log}
              onChange={(v) => update("record_ip_log", v)}
            />
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>
    </div>
  );
}

// ─── 个人设置主页面 ────────────────────────────────────────────────────────────
export default function PersonalSettings() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/api/status")
      .then((res) => setStatus(res.data || res))
      .catch(() => {});
  }, []);

  return (
    <div>
      <UserInfoHeader user={user} />
      {status?.checkin_enabled && <CheckinCalendar />}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <AccountManagement user={user} status={status} />
          <PreferencesCard user={user} />
        </div>
        <div className="lg:col-span-2">
          <OtherSettingsCard user={user} />
        </div>
      </div>
    </div>
  );
}
