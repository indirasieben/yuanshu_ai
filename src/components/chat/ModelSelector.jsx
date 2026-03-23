import { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useModelStore } from "../../stores/modelStore";
import { useChatStore } from "../../stores/chatStore";
import { DEFAULT_MODEL } from "../../lib/config";

export default function ModelSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { getFavoriteModels, getModel, allModels } = useModelStore();
  const { getActiveConversation, switchModel } = useChatStore();

  const activeConversation = getActiveConversation();
  const currentModelId = activeConversation?.model || DEFAULT_MODEL;
  const currentModel = getModel(currentModelId);
  const favorites = getFavoriteModels();

  const handleSelect = (modelId) => {
    switchModel(modelId);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-cream-dark text-[12px] text-ink font-medium border border-border cursor-pointer transition-colors"
      >
        {currentModel?.name || currentModelId}
        <ChevronDown
          size={12}
          className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 w-56 bg-white border border-border rounded-xl shadow-lg z-20 py-1 max-h-72 overflow-y-auto">
            {/* 常用模型 */}
            {favorites.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] text-ink-faint font-medium uppercase tracking-wide">
                  常用模型
                </div>
                {favorites.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] border-none cursor-pointer transition-colors ${
                      model.id === currentModelId
                        ? "bg-cream text-ink"
                        : "bg-transparent text-ink-muted hover:bg-cream/50 hover:text-ink"
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium flex items-center gap-1.5">
                        {model.name}
                        {model.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-cream-dark text-ink-muted rounded-full">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-faint mt-0.5">
                        {model.provider}
                      </div>
                    </div>
                    {model.id === currentModelId && (
                      <Check size={12} className="text-ink" />
                    )}
                  </button>
                ))}
                <div className="h-px bg-border mx-2 my-1" />
              </>
            )}

            {/* 全部模型链接 */}
            <Link
              to="/models"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-[11px] text-accent hover:bg-cream/50 no-underline text-center font-medium"
            >
              从模型列表添加 →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
