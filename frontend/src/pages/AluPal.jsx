import { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ALUPAL } from "@/constants/testIds";
import AlumniCard from "@/components/AlumniCard";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function AluPal() {
  const { user, loading } = useAuth();
  const [f, setF] = useState({ target_college: "", stream: "", grade: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (loading) return <div className="p-10 text-center text-[#525252]">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.target_college || !f.stream) {
      toast.error("Tell AluPal your target college and stream");
      return;
    }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/alupal/match", f);
      setResult(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-xl border-2 border-[#171717] flex items-center justify-center"
          style={{ background: "#dbeafe" }}>
          <Sparkles className="w-5 h-5" />
        </span>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-black">AluPal · your matcher</div>
          <h1 className="font-display font-black text-3xl">Which senior fits your goal?</h1>
        </div>
      </div>
      <p className="text-sm text-[#404040] max-w-2xl">
        Tell AluPal your target college, stream, and one worry. It scans verified alumni and picks the
        best matches with a short reason for each.
      </p>

      <form onSubmit={submit} className="aln-card p-6 mt-6 space-y-4" style={{ background: "#ffedd5" }}>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs uppercase font-black tracking-widest">Target college</label>
            <input required className="aln-input mt-1" placeholder="e.g. IIT Bombay"
              value={f.target_college} onChange={set("target_college")} data-testid={ALUPAL.targetCollege} />
          </div>
          <div>
            <label className="text-xs uppercase font-black tracking-widest">Stream</label>
            <input required className="aln-input mt-1" placeholder="CS / Medical / Commerce"
              value={f.stream} onChange={set("stream")} data-testid={ALUPAL.stream} />
          </div>
          <div>
            <label className="text-xs uppercase font-black tracking-widest">Current grade</label>
            <select className="aln-input mt-1" value={f.grade} onChange={set("grade")} data-testid={ALUPAL.grade}>
              <option value="">Prefer not to say</option>
              <option value="9">9th</option>
              <option value="10">10th</option>
              <option value="11">11th</option>
              <option value="12">12th</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs uppercase font-black tracking-widest">What worries you? (optional)</label>
          <textarea rows={2} className="aln-input mt-1"
            placeholder="e.g. I'm scared my JEE Mains percentile won't be enough..."
            value={f.note} onChange={set("note")} data-testid={ALUPAL.note} />
        </div>
        <div className="flex justify-end">
          <button className="aln-btn-primary" disabled={busy} data-testid={ALUPAL.submitBtn}>
            {busy ? "AluPal is thinking..." : (<>Match me <Send className="w-4 h-4" /></>)}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 aln-pop-in">
          <div
            className="aln-card p-5 mb-6"
            style={{ background: "#dbeafe" }}
            data-testid={ALUPAL.reasoning}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5" />
              <div>
                <div className="font-display font-bold text-lg">AluPal says</div>
                <p className="text-sm text-[#171717] mt-1 leading-relaxed">{result.reasoning}</p>
              </div>
            </div>
          </div>
          {result.matches?.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid={ALUPAL.matchList}>
              {result.matches.map((m) => <AlumniCard key={m.id} alumni={m} showWhy />)}
            </div>
          ) : (
            <div className="aln-card p-8 text-center">
              <p className="font-display font-bold">No matches yet — the community is still growing.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
