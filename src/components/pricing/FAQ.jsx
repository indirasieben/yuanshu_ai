import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { faqs } from "../../data/plans";

function FAQItem({ item, t }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 px-1 text-left bg-transparent border-none cursor-pointer group"
      >
        <span className="text-[14px] font-medium text-ink group-hover:text-ink-light transition-colors pr-4">
          {t(item.q)}
        </span>
        <ChevronDown
          size={16}
          className={`text-ink-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-5 px-1">
          <p className="text-[13px] text-ink-muted leading-relaxed">
            {t(item.a)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-ink text-center mb-14">
          {t("常见问题")}
        </h2>
        <div className="bg-white rounded-2xl border border-border px-7">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} item={faq} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
