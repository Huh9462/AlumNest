import { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CHAT } from "@/constants/testIds";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

const REASONS = [
  { key: "ghosted", label: "Ghosted mid-chat" },
  { key: "rude", label: "Rude or abusive" },
  { key: "inappropriate", label: "Inappropriate content" },
  { key: "spam", label: "Spam or self-promo" },
  { key: "other", label: "Something else" },
];

export default function ReportDialog({ reportedUser, conversationId, onClose }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason) { toast.error("Pick a reason first"); return; }
    setBusy(true);
    try {
      await api.post("/reports", {
        reported_user_id: reportedUser.id,
        reason,
        note,
        conversation_id: conversationId,
      });
      toast.success("Report submitted. Our team will review within 24h.");
      onClose();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setBusy(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(23,23,23,0.45)" }}
      onClick={onClose}
    >
      <div
        className="aln-card p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        data-testid={CHAT.reportDialog}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg border-2 border-[#171717] flex items-center justify-center shrink-0"
              style={{ background: "#ffedd5" }}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-black text-xl">Report {reportedUser.name}</div>
              <div className="text-xs text-[#404040] mt-0.5">
                Reports are reviewed by Alumnest moderators. Repeat offenders lose their account.
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#171717]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase font-black tracking-widest mb-2">Reason</div>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => {
              const active = reason === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReason(r.key)}
                  className={`aln-chip text-xs ${active ? "" : "opacity-70"}`}
                  style={{ background: active ? "#fef08a" : "#fff", cursor: "pointer" }}
                  data-testid={CHAT.reportReason(r.key)}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase font-black tracking-widest mb-1">
            What happened? <span className="text-[#525252] normal-case font-medium">(optional)</span>
          </div>
          <textarea
            className="aln-input"
            rows={4}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Details help moderators act quickly. Paste snippets if useful."
            data-testid={CHAT.reportNote}
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button className="aln-btn-secondary text-sm" onClick={onClose} data-testid={CHAT.reportCancel}>
            Cancel
          </button>
          <button
            className="aln-btn-primary text-sm"
            style={{ background: "#ef4444", borderColor: "#171717" }}
            disabled={busy || !reason}
            onClick={submit}
            data-testid={CHAT.reportSubmit}
          >
            {busy ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}
