import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/authStore";

function readImportedItems(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`imported_api_token:user:${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeImportedItems(userId, items) {
  if (!userId) return;
  localStorage.setItem(
    `imported_api_token:user:${userId}`,
    JSON.stringify(items),
  );
}

function getImportedDefaultId(userId) {
  if (!userId) return "";
  try {
    return (
      localStorage.getItem(`imported_api_token_default_id:user:${userId}`) || ""
    );
  } catch {
    return "";
  }
}

function setImportedDefaultId(userId, id) {
  if (!userId) return;
  localStorage.setItem(
    `imported_api_token_default_id:user:${userId}`,
    String(id || ""),
  );
}

function clearImportedDefaultId(userId) {
  if (!userId) return;
  localStorage.removeItem(`imported_api_token_default_id:user:${userId}`);
}

function setActiveApiToken(userId, key) {
  if (!userId) return;
  const normalized = normalizeKey(key);
  if (!normalized) return;
  localStorage.setItem(`active_api_token:user:${userId}`, normalized);
}

function clearActiveApiToken(userId) {
  if (!userId) return;
  localStorage.removeItem(`active_api_token:user:${userId}`);
}

function normalizeKey(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("sk-") ? trimmed : `sk-${trimmed}`;
}

function maskKey(k) {
  const s = normalizeKey(k);
  if (!s) return "—";
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}****${s.slice(-4)}`;
}

export default function ApiKeySettingsModal({ onClose }) {
  const { t } = useTranslation();
  const userId = useAuthStore.getState().resolveCurrentUserId?.();

  const [items, setItems] = useState(() => readImportedItems(userId));
  const [defaultId, setDefaultId] = useState(() =>
    getImportedDefaultId(userId),
  );
  const [copiedId, setCopiedId] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(readImportedItems(userId));
    setDefaultId(getImportedDefaultId(userId));
  }, [userId]);

  const sortedItems = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    arr.sort((a, b) => Number(b?.updatedAt || 0) - Number(a?.updatedAt || 0));
    return arr;
  }, [items]);

  const copyText = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1500);
    } catch {
      toast.error(t("复制失败"));
    }
  };

  const handleSaveImport = async () => {
    if (!userId) {
      toast.error(t("请先登录"));
      return;
    }
    const trimmedName = String(name || "").trim();
    const normalizedKey = normalizeKey(key);
    if (!trimmedName) {
      toast.error(t("Key 名称为必填项"));
      return;
    }
    if (!normalizedKey) {
      toast.error(t("Key 为必填项"));
      return;
    }

    setSaving(true);
    try {
      const now = Date.now();
      const nextItem = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName,
        key: normalizedKey,
        updatedAt: now,
      };

      const prev = readImportedItems(userId);

      prev.push(nextItem);
      writeImportedItems(userId, prev);

      if (setAsDefault) {
        setImportedDefaultId(userId, nextItem.id);
        setDefaultId(nextItem.id);
        setActiveApiToken(userId, normalizedKey);
      }

      setItems(prev);
      toast.success(t("导入成功"));

      setName("");
      setKey("");
      setSetAsDefault(true);
      setShowImport(false);
    } catch (err) {
      toast.error(err?.message || t("导入失败"));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = (it) => {
    if (!userId) {
      toast.error(t("请先登录"));
      return;
    }
    const normalizedKey = normalizeKey(it?.key);
    if (!normalizedKey) return;
    try {
      setImportedDefaultId(userId, it?.id);
      setDefaultId(String(it?.id || ""));
      setActiveApiToken(userId, normalizedKey);
      toast.success(t("已使用"));
    } catch {
      toast.error(t("操作失败"));
    }
  };

  const handleCancelUse = (it) => {
    if (!userId) {
      toast.error(t("请先登录"));
      return;
    }
    try {
      if (String(defaultId) === String(it?.id)) {
        clearImportedDefaultId(userId);
        setDefaultId("");
      }

      clearActiveApiToken(userId);

      toast.success(t("已取消使用"));
    } catch {
      toast.error(t("操作失败"));
    }
  };

  const handleDelete = (id) => {
    if (!userId) {
      toast.error(t("请先登录"));
      return;
    }
    try {
      const prev = readImportedItems(userId);
      const next = prev.filter((it) => String(it?.id) !== String(id));
      writeImportedItems(userId, next);
      if (String(defaultId) === String(id)) {
        clearImportedDefaultId(userId);
        setDefaultId("");
        clearActiveApiToken(userId);
      }
      setItems(next);
      toast.success(t("已删除"));
    } catch {
      toast.error(t("删除失败"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-ink">{t("导入 Key")}</h2>
            <span className="text-[11px] text-ink-faint">
              {t("导入的 Key 仅保存在当前浏览器")}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-cream-dark rounded-lg text-ink-muted hover:text-ink bg-transparent border-none cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-ink-muted">
              {t("已导入 {{n}} 条", { n: sortedItems.length })}
            </div>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors"
            >
              <Plus size={13} />
              {t("导入 Key")}
            </button>
          </div>

          {showImport && (
            <div className="border border-border rounded-xl bg-cream-light p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-muted mb-1.5">
                    {t("Key 名称")}
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder={t("最长 50 字符")}
                    className="w-full border border-border rounded-xl px-4 py-2.5 bg-white text-ink text-sm outline-none focus:border-ink-muted transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1.5">
                    {t("Key")}
                  </label>
                  <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={t("支持 sk- 前缀，可省略")}
                    className="w-full border border-border rounded-xl px-4 py-2.5 bg-white text-ink text-sm outline-none focus:border-ink-muted transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="rounded border-border cursor-pointer"
                  />
                  <span className="text-xs text-ink-muted">
                    {t("用于对话")}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    disabled={saving}
                    className="px-3 py-2 rounded-xl text-sm text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent border border-border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t("取消")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveImport}
                    disabled={saving}
                    className="px-3 py-2 rounded-xl text-sm bg-ink text-cream-light hover:bg-ink-light border-none cursor-pointer transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? t("保存中...") : t("保存")}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-cream-light/60">
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">
                    {t("名称")}
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">
                    {t("密钥")}
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-medium text-ink-muted">
                    {t("操作")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center">
                      <p className="text-sm text-ink-muted">
                        {t(
                          "暂无导入 Key，对话默认使用账户 Key，可导入后设置为当前对话使用。",
                        )}
                      </p>
                      <p className="text-xs text-ink-faint mt-1">
                        {t("点击「导入 Key」添加一条")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((it) => {
                    const isDefault =
                      defaultId && String(defaultId) === String(it?.id);
                    const normalizedKey = normalizeKey(it?.key);
                    return (
                      <tr
                        key={String(it?.id)}
                        className="border-b border-border last:border-0 hover:bg-cream-light/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-muted">
                              {it?.name || t("未命名")}
                            </span>
                            {isDefault && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-medium">
                                {t("使用中")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-[11px] font-mono text-ink-muted select-all">
                            {maskKey(normalizedKey)}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                normalizedKey
                                  ? copyText(normalizedKey, `k-${it?.id}`)
                                  : void 0
                              }
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors"
                            >
                              {copiedId === `k-${it?.id}` ? (
                                <Check size={13} className="text-green-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                              {t("复制")}
                            </button>
                            {isDefault ? (
                              <button
                                type="button"
                                onClick={() => handleCancelUse(it)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors"
                              >
                                {t("取消使用")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(it)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-ink-muted hover:text-ink hover:bg-cream-dark bg-transparent cursor-pointer transition-colors"
                              >
                                {t("使用")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(it?.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-100 text-red-500 hover:bg-red-50 bg-transparent cursor-pointer transition-colors"
                            >
                              <Trash2 size={13} />
                              {t("删除")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
