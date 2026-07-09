import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CERT } from "@/constants/testIds";
import { Award, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function Certificate() {
  const { user, loading } = useAuth();
  const [cert, setCert] = useState(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/certificate/me")
      .then((r) => setCert(r.data))
      .catch((e) => toast.error(formatApiError(e)))
      .finally(() => setBusy(false));
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (busy) return <div className="p-10 text-center">Loading...</div>;
  if (!cert) return <div className="p-10 text-center">No certificate available.</div>;

  const isAlumni = cert.user.role === "alumni";
  const dateStr = new Date(cert.issued_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const print = () => window.print();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" data-testid={CERT.root}>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-black">Your scorecard</div>
          <h1 className="font-display font-black text-3xl">A printable proof of impact.</h1>
        </div>
        <div className="flex gap-2">
          <button className="aln-btn-secondary text-sm" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied!"))}>
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="aln-btn-primary text-sm" onClick={print} data-testid={CERT.downloadBtn}>
            <Download className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      <div className="aln-card p-0 overflow-hidden">
        {/* Ticket top */}
        <div className="p-8 border-b-2 border-[#171717]" style={{ background: "#fef08a" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] font-black">Alumnest · Mentor Scorecard</div>
              <div className="font-display font-black text-4xl mt-2 leading-none">{cert.user.name}</div>
              <div className="text-sm mt-1 font-bold">
                {isAlumni ? `${cert.user.college || "—"} · ${cert.user.stream || "—"}` : `${cert.user.school} · Grade ${cert.user.grade || "—"}`}
              </div>
            </div>
            <Award className="w-14 h-14 shrink-0" strokeWidth={2.4} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x-2 divide-[#171717] border-b-2 border-[#171717]">
          <div className="p-6" style={{ background: "#d1fae5" }}>
            <div className="text-xs uppercase font-black tracking-widest">Points</div>
            <div className="font-display font-black text-4xl mt-1" data-testid={CERT.points}>{cert.user.points || 0}</div>
          </div>
          <div className="p-6" style={{ background: "#dbeafe" }}>
            <div className="text-xs uppercase font-black tracking-widest">Global rank</div>
            <div className="font-display font-black text-4xl mt-1" data-testid={CERT.rank}>
              {isAlumni && cert.rank ? `#${cert.rank}` : "—"}
            </div>
            <div className="text-xs mt-1">{isAlumni ? `of ${cert.total_alumni} alumni` : "For juniors, keep helping!"}</div>
          </div>
          <div className="p-6" style={{ background: "#ffedd5" }}>
            <div className="text-xs uppercase font-black tracking-widest">Percentile</div>
            <div className="font-display font-black text-4xl mt-1" data-testid={CERT.percentile}>
              {isAlumni && cert.percentile ? `Top ${100 - cert.percentile + 1}%` : "—"}
            </div>
          </div>
        </div>

        <div className="p-6 flex items-center justify-between text-sm">
          <div>
            <div className="text-xs uppercase font-black tracking-widest text-[#525252]">Certificate ID</div>
            <div className="font-mono">{cert.certificate_id}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase font-black tracking-widest text-[#525252]">Issued</div>
            <div className="font-mono">{dateStr}</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#525252] mt-4 max-w-2xl">
        This scorecard is auto-updated as you help juniors on Alumnest. Colleges and hiring
        managers can verify it via the Certificate ID.
      </p>
    </div>
  );
}
