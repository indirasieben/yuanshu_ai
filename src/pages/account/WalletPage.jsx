import { useState, useEffect, useRef, useCallback } from "react";
import {
  Copy,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRightLeft,
  Gift,
  Ticket,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

import { formatSubscriptionDuration } from "../../helpers/subscriptionFormat.js";

// ─── 额度展示 ─────────────────────────────────────────────────────────────────
function renderQuota(q) {
  if (q == null) return "$0.00";
  return `$${(q / 500000).toFixed(2)}`;
}

// ─── 通用 Modal ───────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div
        className={`bg-card rounded-xl border border-border w-full ${maxWidth} shadow-lg max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <span className="text-sm font-medium text-ink">{title}</span>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl leading-none cursor-pointer border-none bg-transparent"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── 状态标签 ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: { label: "待支付", cls: "bg-amber-100 text-amber-700" },
    success: { label: "已完成", cls: "bg-emerald-100 text-emerald-700" },
    expired: { label: "已过期", cls: "bg-cream-dark text-ink-muted" },
  };
  const s = map[status] || {
    label: status,
    cls: "bg-cream-dark text-ink-muted",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ─── 支付方式名称 ──────────────────────────────────────────────────────────────
function payMethodLabel(method) {
  const map = {
    alipay: "支付宝",
    wxpay: "微信支付",
    stripe: "Stripe",
    creem: "Creem",
  };
  return map[method] || method;
}

// ─── 充值历史弹窗 ─────────────────────────────────────────────────────────────
function TopupHistoryModal({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p, kw) => {
      setLoading(true);
      try {
        const params = `p=${p}&page_size=${pageSize}${kw ? `&keyword=${encodeURIComponent(kw)}` : ""}`;
        const res = await api.get(`/api/user/topup/self?${params}`);
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (open) {
      setPage(1);
      load(1, keyword);
    }
  }, [open]); // eslint-disable-line

  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
    load(1, searchInput);
  };

  const handlePage = (p) => {
    setPage(p);
    load(p, keyword);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Modal open={open} onClose={onClose} title="充值记录" maxWidth="max-w-2xl">
      {/* 搜索栏 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索订单号…"
            className="w-full pl-8 pr-4 py-2 border border-border rounded-xl bg-cream-light text-ink text-xs outline-none focus:border-ink-muted"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 rounded-xl bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors"
        >
          搜索
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-8 text-xs text-ink-muted">加载中…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-xs text-ink-muted">
          暂无充值记录
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-cream-light border border-border gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-ink truncate">
                  {item.trade_no}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {payMethodLabel(item.payment_method)} ·{" "}
                  {new Date(item.create_time * 1000).toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-ink">
                  {renderQuota(item.amount)}
                </p>
                <p className="text-[11px] text-ink-muted">
                  ¥{Number(item.money || 0).toFixed(2)}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-ink-muted">共 {total} 条</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => handlePage(page - 1)}
              className="p-1.5 rounded-lg border border-border bg-cream-light text-ink-muted hover:bg-cream-dark cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="px-3 text-xs text-ink">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => handlePage(page + 1)}
              className="p-1.5 rounded-lg border border-border bg-cream-light text-ink-muted hover:bg-cream-dark cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── 充值确认弹窗 ─────────────────────────────────────────────────────────────
function PaymentConfirmModal({
  open,
  onClose,
  amount,
  actualAmount,
  currency,
  methodLabel,
  onConfirm,
  confirming,
}) {
  return (
    <Modal open={open} onClose={onClose} title="确认充值">
      <div className="space-y-4">
        <div className="bg-cream-light rounded-xl border border-border divide-y divide-border">
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-ink-muted">充值额度</span>
            <span className="text-sm font-medium text-ink">
              {renderQuota(amount * 500000)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-ink-muted">支付方式</span>
            <span className="text-sm text-ink">{methodLabel}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-xs text-ink-muted">实付金额</span>
            <span className="text-base font-semibold text-red-500">
              {currency === "USD"
                ? `$${Number(actualAmount).toFixed(2)}`
                : `¥${Number(actualAmount).toFixed(2)}`}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-2 rounded-lg bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
          >
            {confirming ? "处理中…" : "确认支付"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── 划转弹窗 ─────────────────────────────────────────────────────────────────
function TransferModal({ open, onClose, maxQuota, onSuccess }) {
  const maxUSD = (maxQuota / 500000).toFixed(2);
  const [inputUSD, setInputUSD] = useState("");
  const [transferring, setTransferring] = useState(false);

  const handleTransfer = async () => {
    const usd = parseFloat(inputUSD);
    if (!usd || usd <= 0) {
      toast.error("请输入划转金额");
      return;
    }
    const quota = Math.round(usd * 500000);
    if (quota > maxQuota) {
      toast.error(`最多可划转 $${maxUSD}`);
      return;
    }
    setTransferring(true);
    try {
      await api.post("/api/user/aff_transfer", { quota });
      toast.success("划转成功");
      onSuccess();
      onClose();
      setInputUSD("");
    } catch (err) {
      toast.error(err.message || "划转失败");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="邀请额度划转">
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          将邀请奖励额度划转到主账户余额，可用于 API 调用消费。
        </p>
        <div>
          <label className="block text-xs text-ink-muted mb-1.5">
            划转金额（USD，最多可划转{" "}
            <span className="text-ink font-medium">${maxUSD}</span>）
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputUSD}
              onChange={(e) => setInputUSD(e.target.value)}
              min="0.000002"
              max={maxUSD}
              step="0.01"
              placeholder={`0.00 ~ ${maxUSD}`}
              className="flex-1 border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted"
            />
            <button
              onClick={() => setInputUSD(maxUSD)}
              className="px-3 py-2 rounded-xl border border-border bg-cream-light text-ink-muted text-xs hover:bg-cream-dark cursor-pointer transition-colors"
            >
              全部
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm text-ink-muted border border-border bg-cream-light hover:bg-cream-dark cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleTransfer}
            disabled={transferring}
            className="flex-1 px-4 py-2 rounded-lg bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
          >
            {transferring ? "划转中…" : "确认划转"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Epay 表单提交 ────────────────────────────────────────────────────────────
function submitEpayForm(url, params) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = "_blank";
  Object.entries(params).forEach(([k, v]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

// ─── 在线充值 Tab ─────────────────────────────────────────────────────────────
function RechargeTab({ topupInfo }) {
  const {
    enable_online_topup,
    enable_stripe_topup,
    enable_creem_topup,
    pay_methods = [],
    amount_options = [],
    discount = {},
    min_topup = 1,
    stripe_min_topup = 1,
    creem_products = [],
  } = topupInfo || {};

  const [amount, setAmount] = useState("");
  const [actualAmount, setActualAmount] = useState(null);
  const [actualCurrency, setActualCurrency] = useState("CNY");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const debounceRef = useRef(null);

  // 实时查询实付金额（易支付/Stripe）
  const fetchAmount = useCallback(async (val, method) => {
    const num = parseInt(val);
    if (!num || num < 1) {
      setActualAmount(null);
      return;
    }
    try {
      if (method === "stripe") {
        const res = await api.post("/api/user/stripe/amount", {
          amount: num,
          payment_method: "stripe",
        });
        setActualAmount(res.data?.amount ?? res.data);
        setActualCurrency("USD");
      } else {
        const res = await api.post("/api/user/amount", {
          amount: num,
          payment_method: method || "alipay",
        });
        setActualAmount(res.data?.amount ?? res.data);
        setActualCurrency("CNY");
      }
    } catch {
      setActualAmount(null);
    }
  }, []);

  const handleAmountChange = (val) => {
    setAmount(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAmount(val, selectedMethod?.type);
    }, 500);
  };

  const handleMethodClick = (method) => {
    setSelectedMethod(method);
    if (amount) fetchAmount(amount, method.type);
    setShowConfirm(true);
  };

  const handleConfirmPay = async () => {
    const num = parseInt(amount);
    if (!num) {
      toast.error("请输入充值数量");
      return;
    }
    setConfirming(true);
    try {
      if (selectedMethod?.type === "stripe") {
        const minS = stripe_min_topup || 1;
        if (num < minS) {
          toast.error(`Stripe 最低充值 ${minS} 单位`);
          setConfirming(false);
          return;
        }
        if (num > 10000) {
          toast.error("Stripe 单次最多充值 10000 单位");
          setConfirming(false);
          return;
        }
        const res = await api.post("/api/user/stripe/pay", {
          amount: num,
          payment_method: "stripe",
          success_url: window.location.href,
          cancel_url: window.location.href,
        });
        const link = res.data?.pay_link || res.data;
        if (link) window.open(link, "_blank");
        else toast.error("获取支付链接失败");
      } else {
        const minT = min_topup || 1;
        if (num < minT) {
          toast.error(`最低充值 ${minT} 单位`);
          setConfirming(false);
          return;
        }
        const res = await api.post("/api/user/pay", {
          amount: num,
          payment_method: selectedMethod?.type,
        });
        if (res.url && res.data) {
          submitEpayForm(res.url, res.data);
        } else {
          toast.error("获取支付参数失败");
        }
      }
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.message || "支付发起失败");
    } finally {
      setConfirming(false);
    }
  };

  // Creem 产品购买
  const handleCreemBuy = async (product) => {
    if (
      !window.confirm(
        `确认购买「${product.name}」，支付 ${product.price} ${product.currency}？`,
      )
    )
      return;
    try {
      const res = await api.post("/api/user/creem/pay", {
        product_id: product.productId,
        payment_method: "creem",
      });
      const link = res.data?.pay_link || res.data;
      if (link) window.open(link, "_blank");
      else toast.error("获取支付链接失败");
    } catch (err) {
      toast.error(err.message || "发起失败");
    }
  };

  const discountForAmount = amount && discount[parseInt(amount)];
  const hasOnlineTopup =
    enable_online_topup || enable_stripe_topup || enable_creem_topup;

  return (
    <div>
      {!hasOnlineTopup ? (
        <div className="text-center py-8">
          <p className="text-sm text-ink-muted">在线充值暂未开放</p>
          <p className="text-xs text-ink-faint mt-1">请使用兑换码充值</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 预设金额快捷选项 */}
          {amount_options.length > 0 && (
            <div>
              <label className="block text-xs text-ink-muted mb-2">
                快捷选择
              </label>
              <div className="flex flex-wrap gap-2">
                {amount_options.map((opt) => {
                  const d = discount[opt];
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAmountChange(String(opt))}
                      className={`relative px-4 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                        amount === String(opt)
                          ? "bg-ink text-cream-light border-ink"
                          : "bg-cream-light text-ink border-border hover:bg-cream-dark"
                      }`}
                    >
                      {opt}
                      {d && d < 1 && (
                        <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded text-[9px] bg-red-500 text-white font-bold leading-none">
                          {Math.round(d * 10)}折
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 数量输入 */}
          <div>
            <label className="block text-xs text-ink-muted mb-2">
              充值数量（单位）
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min={min_topup || 1}
              placeholder={`最低 ${min_topup || 1} 单位`}
              className="w-full border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted"
            />
            {amount && (
              <p className="text-xs text-ink-muted mt-1">
                ≈ {renderQuota(parseInt(amount || 0) * 500000)}
                {discountForAmount && discountForAmount < 1 && (
                  <span className="ml-2 text-red-500 font-medium">
                    {Math.round(discountForAmount * 10)}折优惠
                  </span>
                )}
              </p>
            )}
          </div>

          {/* 实付金额预览 */}
          {actualAmount != null && (
            <div className="px-4 py-3 rounded-xl bg-cream-light border border-border">
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-muted">预计实付</span>
                <span className="text-lg font-semibold text-red-500">
                  {actualCurrency === "USD"
                    ? `$${Number(actualAmount).toFixed(2)}`
                    : `¥${Number(actualAmount).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}

          {/* Epay 支付按钮 */}
          {enable_online_topup && pay_methods.length > 0 && (
            <div>
              <label className="block text-xs text-ink-muted mb-2">
                选择支付方式
              </label>
              <div className="flex flex-wrap gap-2">
                {pay_methods.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => handleMethodClick(m)}
                    style={
                      m.color ? { borderColor: m.color, color: m.color } : {}
                    }
                    className="px-5 py-2.5 rounded-xl border text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity bg-transparent"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stripe 按钮 */}
          {enable_stripe_topup && (
            <div>
              {!enable_online_topup && (
                <label className="block text-xs text-ink-muted mb-2">
                  选择支付方式
                </label>
              )}
              <button
                onClick={() =>
                  handleMethodClick({ type: "stripe", name: "Stripe" })
                }
                className="px-5 py-2.5 rounded-xl border border-[#635BFF] text-[#635BFF] text-sm font-medium cursor-pointer hover:bg-[#635BFF]/5 transition-colors bg-transparent"
              >
                💳 Stripe 信用卡
              </button>
            </div>
          )}

          {/* Creem 产品 */}
          {enable_creem_topup && creem_products.length > 0 && (
            <div>
              <label className="block text-xs text-ink-muted mb-2">
                Creem 套餐
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {creem_products.map((p) => (
                  <button
                    key={p.productId}
                    onClick={() => handleCreemBuy(p)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-cream-light hover:bg-cream-dark cursor-pointer transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {renderQuota(p.quota)} 额度
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {p.price} {p.currency}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 充值确认弹窗 */}
      <PaymentConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        amount={parseInt(amount) || 0}
        actualAmount={actualAmount}
        currency={actualCurrency}
        methodLabel={selectedMethod?.name || ""}
        onConfirm={handleConfirmPay}
        confirming={confirming}
      />
    </div>
  );
}

// ─── 订阅计划 Tab ─────────────────────────────────────────────────────────────
function SubscriptionTab({ plans, currentSub }) {
  console.log(plans);
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-ink-muted">暂无订阅计划</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {plans.map((p) => {
        const plan = p.plan;
        const isActive =
          currentSub?.plan_id === plan.id && currentSub?.status === "active";
        return (
          <div
            key={plan.id}
            className={`px-4 py-4 rounded-xl border transition-colors ${
              isActive ? "border-ink bg-ink/5" : "border-border bg-cream-light"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ink">
                    {plan.title}
                  </span>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-medium">
                      当前订阅
                    </span>
                  )}
                </div>
                {plan.subtitle && (
                  <p className="text-xs text-ink-muted mt-1">{plan.subtitle}</p>
                )}
                <p className="text-xs text-ink-faint mt-1">
                  有效期: {formatSubscriptionDuration(plan)}
                </p>
                {plan.total_amount && (
                  <p className="text-xs text-ink-faint mt-1">
                    总额度 {renderQuota(plan.total_amount)}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {plan.price_amount != null && (
                  <p className="text-base font-semibold text-ink">
                    {plan.currency === "USD"
                      ? `$${plan.price_amount}`
                      : `¥${plan.price_amount}`}
                    <span className="text-xs text-ink-muted font-normal">
                      /期
                    </span>
                  </p>
                )}
                {!isActive && (
                  <button
                    onClick={() => toast("订阅功能即将上线", { icon: "🔔" })}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-ink text-cream-light text-xs font-medium border-none cursor-pointer hover:bg-ink-light transition-colors"
                  >
                    订阅
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 充值卡（左列） ────────────────────────────────────────────────────────────
function RechargeCard({ topupInfo, plans, currentSub }) {
  const hasPlans = plans && plans.length > 0;
  const [activeTab, setActiveTab] = useState(
    hasPlans ? "subscription" : "recharge",
  );
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { fetchSelf } = useAuthStore();

  const tabs = [
    { key: "recharge", label: "充值" },
    ...(hasPlans ? [{ key: "subscription", label: "订阅计划" }] : []),
  ];

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error("请输入兑换码");
      return;
    }
    setRedeeming(true);
    try {
      const res = await api.post("/api/user/topup", { key: redeemCode.trim() });
      const quota = res.data;
      if (res.success !== false) {
        toast.success(`兑换成功！获得 ${renderQuota(quota)}`);
        setRedeemCode("");
        await fetchSelf();
      } else {
        toast.error(res.message || "兑换失败");
      }
    } catch (err) {
      toast.error(err.message || "兑换失败");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 充值 / 订阅 主卡 */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-ink flex-1">在线充值</h3>
        </div>

        {/* Tab 切换 */}
        {tabs.length > 1 && (
          <div className="bg-cream-light rounded-lg p-1 flex gap-1 mb-5 w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${
                  activeTab === t.key
                    ? "bg-card text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink bg-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === "recharge" ? (
          <RechargeTab topupInfo={topupInfo} />
        ) : (
          <SubscriptionTab plans={plans} currentSub={currentSub} />
        )}
      </div>

      {/* 兑换码区 */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Ticket size={14} className="text-ink-muted" />
          <h3 className="text-sm font-medium text-ink">兑换码充值</h3>
        </div>
        <div className="flex gap-2">
          <input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
            placeholder="输入兑换码"
            className="flex-1 border border-border rounded-xl px-4 py-2.5 bg-cream-light text-ink text-sm outline-none focus:border-ink-muted"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="px-5 py-2.5 rounded-xl bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-50 hover:bg-ink-light transition-colors"
          >
            {redeeming ? "兑换中…" : "兑换"}
          </button>
        </div>
      </div>

      {/* 查看充值历史 */}
      <button
        onClick={() => setShowHistory(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-sm text-ink-muted hover:bg-cream-dark cursor-pointer transition-colors w-full text-left"
      >
        <History size={14} />
        查看充值历史
      </button>

      <TopupHistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

// ─── 邀请奖励卡（右列） ────────────────────────────────────────────────────────
function InvitationCard() {
  const { user, fetchSelf } = useAuthStore();
  const [affCode, setAffCode] = useState(user?.aff_code || "");
  const [showTransfer, setShowTransfer] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    if (!user?.aff_code) {
      setCodeLoading(true);
      api
        .get("/api/user/aff")
        .then((res) => {
          setAffCode(res.data?.aff_code || res.data || "");
        })
        .catch(() => {})
        .finally(() => setCodeLoading(false));
    } else {
      setAffCode(user.aff_code);
    }
  }, [user?.aff_code]);

  const inviteLink = affCode
    ? `${window.location.origin}/register?aff=${affCode}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("邀请链接已复制");
    } catch {}
  };

  const affQuota = user?.aff_quota || 0;

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Gift size={14} className="text-ink-muted" />
          <h3 className="text-sm font-medium text-ink">邀请奖励</h3>
        </div>

        {/* 邀请统计 Banner */}
        <div className="grid grid-cols-1 gap-2 mb-5">
          {[
            { label: "待使用邀请额度", value: renderQuota(user?.aff_quota) },
            {
              label: "历史累计额度",
              value: renderQuota(user?.aff_history_quota),
            },
            { label: "已邀请人数", value: `${user?.aff_count ?? 0} 人` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex justify-between items-center px-4 py-3 rounded-xl bg-cream-light border border-border"
            >
              <span className="text-xs text-ink-muted">{stat.label}</span>
              <span className="text-sm font-medium text-ink">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* 邀请链接 */}
        <div className="mb-4">
          <label className="block text-xs text-ink-muted mb-2">
            专属邀请链接
          </label>
          {codeLoading ? (
            <p className="text-xs text-ink-faint">生成中…</p>
          ) : (
            <div className="flex gap-2">
              <input
                value={inviteLink}
                readOnly
                className="flex-1 border border-border rounded-xl px-3 py-2 bg-cream-light text-ink text-xs outline-none font-mono min-w-0"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-cream-light text-ink-muted hover:bg-cream-dark cursor-pointer transition-colors text-xs"
              >
                <Copy size={12} />
                复制
              </button>
            </div>
          )}
        </div>

        {/* 划转按钮 */}
        <button
          onClick={() => setShowTransfer(true)}
          disabled={affQuota <= 0}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-ink text-cream-light text-sm font-medium border-none cursor-pointer disabled:opacity-40 hover:bg-ink-light transition-colors"
        >
          <ArrowRightLeft size={14} />
          划转到余额
          {affQuota > 0 && (
            <span className="text-xs opacity-80">
              （{renderQuota(affQuota)}）
            </span>
          )}
        </button>
      </div>

      {/* 邀请规则 */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-medium text-ink mb-2">邀请规则</p>
        <ul className="space-y-1.5 text-xs text-ink-muted">
          <li className="flex items-start gap-1.5">
            <span className="shrink-0">·</span>
            <span>分享专属链接，好友注册即绑定邀请关系</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="shrink-0">·</span>
            <span>好友充值后，你将获得对应比例的奖励额度</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="shrink-0">·</span>
            <span>邀请奖励累积后可随时划转到主余额使用</span>
          </li>
        </ul>
      </div>

      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        maxQuota={affQuota}
        onSuccess={fetchSelf}
      />
    </div>
  );
}

// ─── 账户统计 Banner ───────────────────────────────────────────────────────────
function AccountStatsBanner({ user }) {
  const stats = [
    { label: "当前余额", value: renderQuota(user?.quota), accent: true },
    { label: "历史消耗", value: renderQuota(user?.used_quota) },
    { label: "请求次数", value: (user?.request_count || 0).toLocaleString() },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border p-4 ${s.accent ? "bg-ink border-ink text-cream-light" : "bg-card border-border"}`}
        >
          <p
            className={`text-xs mb-1 ${s.accent ? "text-cream-light/70" : "text-ink-muted"}`}
          >
            {s.label}
          </p>
          <p
            className={`text-lg font-semibold ${s.accent ? "text-cream-light" : "text-ink"}`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { user } = useAuthStore();
  const [topupInfo, setTopupInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        const [infoRes, plansRes, subRes] = await Promise.allSettled([
          api.get("/api/user/topup/info"),
          api.get("/api/subscription/plans"),
          api.get("/api/subscription/self"),
        ]);
        if (!mounted) return;
        if (infoRes.status === "fulfilled")
          setTopupInfo(infoRes.value?.data || infoRes.value || null);
        if (plansRes.status === "fulfilled")
          setPlans(plansRes.value?.data?.items || plansRes.value?.data || []);
        if (subRes.status === "fulfilled")
          setCurrentSub(subRes.value?.data || null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-ink-muted">加载中…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-medium text-ink mb-5">钱包管理</h2>
      <AccountStatsBanner user={user} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RechargeCard
            topupInfo={topupInfo}
            plans={plans}
            currentSub={currentSub}
          />
        </div>
        <div className="lg:col-span-1">
          <InvitationCard />
        </div>
      </div>
    </div>
  );
}
