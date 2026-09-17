import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { evidenceUrl, evidenceViewUrl } from "@/lib/evidence";
import { Camera, Loader2, X, FileText, Cloud, HardDrive } from "lucide-react";

export function EvidenceUploader({ assignmentId, questionId, items, onChange, label = "Upload receipt / photo", testid }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(null);
  const mine = items.filter((e) => (e.question_id || "") === (questionId || ""));

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const f of files) {
      setProgress(0);
      try {
        const item = await api.uploadEvidence(assignmentId, f, questionId, setProgress);
        onChange([...items, item]);
        toast.success(item.provider === "google_drive" ? "Uploaded to Google Drive" : "Uploaded");
      } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
      finally { setProgress(null); }
    }
  };

  return (
    <div data-testid={testid}>
      {mine.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {mine.map((it) => (
            <div key={it.id} className="relative group rounded-lg overflow-hidden border border-[#212836] bg-[#151B23] aspect-square" data-testid={`evidence-item-${it.id}`}>
              {it.mime?.startsWith("image/") ? (
                <a href={evidenceViewUrl(it)} target="_blank" rel="noreferrer"><img src={evidenceUrl(it)} alt={it.name} className="w-full h-full object-cover" /></a>
              ) : (
                <a href={evidenceViewUrl(it)} target="_blank" rel="noreferrer" className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[10px] p-1"><FileText className="w-6 h-6 mb-1" />{it.name}</a>
              )}
              <span className="absolute bottom-1 left-1 text-[9px] px-1 rounded bg-black/70 text-slate-300 flex items-center gap-0.5">
                {it.provider === "google_drive" ? <Cloud className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}{it.provider === "google_drive" ? "Drive" : "Local"}
              </span>
              <button type="button" onClick={() => onChange(items.filter((x) => x.id !== it.id))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center" data-testid={`evidence-remove-${it.id}`}><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => ref.current?.click()} disabled={progress !== null}
        className="w-full border border-dashed border-[#212836] hover:border-[#E5A93C]/50 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-slate-400 transition-colors" data-testid={testid ? `${testid}-button` : undefined}>
        {progress !== null ? <><Loader2 className="w-4 h-4 animate-spin text-[#E5A93C]" /> Uploading {progress}%</> : <><Camera className="w-4 h-4 text-[#E5A93C]" /> {mine.length ? "Add another file" : label}</>}
      </button>
      <input ref={ref} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={pick} data-testid={testid ? `${testid}-input` : undefined} />
    </div>
  );
}
