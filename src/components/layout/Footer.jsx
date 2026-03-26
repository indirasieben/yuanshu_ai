import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  const footerBlocks = useMemo(
    () => [
      {
        categoryKey: "产品",
        links: [
          { labelKey: "AI 对话", href: "/chat" },
          { labelKey: "图片生成", href: "#" },
          { labelKey: "API 接入", href: "#" },
          { labelKey: "模型列表", href: "#" },
        ],
      },
      {
        categoryKey: "资源",
        links: [
          { labelKey: "文档中心", href: "#" },
          { labelKey: "API 参考", href: "#" },
          { labelKey: "使用教程", href: "#" },
          { labelKey: "更新日志", href: "#" },
        ],
      },
      {
        categoryKey: "公司",
        links: [
          { labelKey: "关于我们", href: "#" },
          { labelKey: "定价方案", href: "/pricing" },
          { labelKey: "联系我们", href: "#" },
          { labelKey: "加入团队", href: "#" },
        ],
      },
      {
        categoryKey: "法律",
        links: [
          { labelKey: "服务条款", href: "#" },
          { labelKey: "隐私政策", href: "#" },
          { labelKey: "使用规范", href: "#" },
        ],
      },
    ],
    [],
  );

  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <span className="font-serif text-lg font-bold text-ink italic">
              {t("元枢 AI")}
            </span>
            <p className="text-[13px] text-ink-muted leading-relaxed mt-3 whitespace-pre-line">
              {t("面向大中华区的\n智能模型聚合平台")}
            </p>
          </div>

          {footerBlocks.map((block) => (
            <div key={block.categoryKey}>
              <h4 className="text-xs font-medium text-ink uppercase tracking-widest mb-5">
                {t(block.categoryKey)}
              </h4>
              <ul className="space-y-3 list-none p-0 m-0">
                {block.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-ink-muted hover:text-ink no-underline transition-colors"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-ink-muted">
            {t("© {{year}} 元枢 AI. 保留所有权利。", {
              year: new Date().getFullYear(),
            })}
          </p>
          <p className="text-xs text-ink-muted">{t("用心制作于香港")}</p>
        </div>
      </div>
    </footer>
  );
}
