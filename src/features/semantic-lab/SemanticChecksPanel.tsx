import { Check, X } from "lucide-react";
import { useCompilerStore } from "../../store/compilerStore";

export function SemanticChecksPanel() {
  const semantic = useCompilerStore((state) => state.semantic);
  if (!semantic) return <div className="p-4 text-xs font-bold text-black">Semantic analysis runs after a successful parse.</div>;

  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar space-y-2 bg-white">
      {semantic.events.map((event) => {
        const isError = event.type === "SEMANTIC_ERROR" || event.type === "TYPE_CHECK_FAILED";
        return (
          <div
            key={event.id}
            className={`flex items-center justify-between rounded-xl border-2 border-black p-3 text-xs font-bold shadow-[2px_2px_0px_0px_#000000] ${
              isError ? "bg-[#FCA5A5]" : "bg-[#BAE6FD]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`grid h-6 w-6 place-items-center rounded-full border-2 border-black ${
                  isError ? "bg-white text-red-600" : "bg-white text-green-700"
                }`}
              >
                {isError ? <X size={14} /> : <Check size={14} />}
              </div>
              <span className="text-black">{event.message}</span>
            </div>

            {event.scopeId && (
              <span className="rounded-md border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black">
                {event.scopeId}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

