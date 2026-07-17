import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CERT } from "@/constants/testIds";
import {
  Award, Download, Share2, ShieldCheck, Clock, Zap, Flame,
  Users, MessagesSquare, TrendingUp, Sparkles, Calendar,
} from "lucide-react";
import { toast } from "sonner";

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch { return "—"; }
}
function fmtRelative(iso) {
  if (!iso) return "Never";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d} days ago`;
    const m = Math.floor(d / 30);
    if (m < 12) return `${m} month${m > 1 ? "s" : ""} ago`;
    const y = Math.floor(m / 12);
    return `${y} year${y > 1 ? "s" : ""} ago`;
  } catch { return "—"; }
}

function Stat({ label, value, sub, bg, testId, icon: Icon }) {
  return (
    <div className="aln-card-flat p-4" style={{ background: bg }}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase font-black tracking-widest text-[#171717]">{label}</div>
        {Icon && <Icon className="w-4 h-4" />}
      </div>
      <div className="font-display font-black text-3xl mt-1" data-testid={testId}>{value}</div>
      {sub && <div className="text-xs text-[#404040] mt-0.5">{sub}</div>}
    </div>
  );
}

const BADGE_BG = { yellow: "#fef08a", mint: "#d1fae5", blue: "#dbeafe", coral: "#ffedd5" };

export default function Certificate() {
  const { user, loading } = useAuth();
  const [cert, setCert] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "alumni") { setBusy(false); return; }
    api.get("/certificate/me")
      .then((r) => setCert(r.data))
      .catch((e) => setErr(formatApiError(e)))
      .finally(() => setBusy(false));
  }, [user]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (user.role !== "alumni") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="aln-card p-8 text-center">
          <Award className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-display font-black text-3xl">Scorecards are for mentors.</h1>
          <p className="text-sm text-[#404040] mt-2">
            As a junior, your job is to ask great questions. Alumni earn scorecards for the juniors
            they help — and you help make theirs stronger every time you log a "They helped me".
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Link to="/alupal" className="aln-btn-primary text-sm">Find a mentor with AluPal</Link>
            <Link to="/alumni" className="aln-btn-secondary text-sm">Browse mentors</Link>
          </div>
        </div>
      </div>
    );
  }

  if (busy) return <div className="p-10 text-center">Loading...</div>;
  if (err) return <div className="max-w-md mx-auto p-10 text-center text-[#ef4444]">{err}</div>;
  if (!cert) return <div className="p-10 text-center">No scorecard available.</div>;

  const print = () => window.print();
  const share = () => navigator.clipboard.writeText(window.location.href)
    .then(() => toast.success("Link copied!"))
    .catch(() => toast.error("Copy failed"));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10" data-testid={CERT.root}>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-black">Mentor scorecard</div>
          <h1 className="font-display font-black text-3xl">A verified proof of impact.</h1>
          <p className="text-sm text-[#404040] mt-1">
            Every number below is generated from real, ID-verified juniors who marked you as helpful.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="aln-btn-secondary text-sm" onClick={share}>
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="aln-btn-primary text-sm" onClick={print} data-testid={CERT.downloadBtn}>
            <Download className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* CERTIFICATE HERO */}
      <div className="aln-card p-0 overflow-hidden">
        <div className="p-6 sm:p-8 border-b-2 border-[#171717] relative" style={{ background: "#fef08a" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.3em] font-black">Alumnest · Mentor Scorecard</div>
              <div className="font-display font-black text-3xl sm:text-5xl mt-2 leading-none truncate">{cert.user.name}</div>
              <div className="text-sm mt-2 font-bold">
                {cert.user.college || "—"} · {cert.user.stream || "—"}
              </div>
              <div className="text-xs mt-0.5">{cert.user.school}</div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {cert.id_verified && (
                  <span className="aln-chip" style={{ background: "#fff" }}>
                    <ShieldCheck className="w-3 h-3" /> ID-verified
                  </span>
                )}
                <span className="aln-chip" style={{ background: "#fff" }}>
                  <Calendar className="w-3 h-3" /> Since {fmtDate(cert.member_since)}
                </span>
                <span className="aln-chip" style={{ background: "#fff" }}>
                  <Clock className="w-3 h-3" /> Works {cert.working_hours_start}–{cert.working_hours_end}
                </span>
              </div>
            </div>
            <Award className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" strokeWidth={2.2} />
          </div>
        </div>

        {/* HEADLINE STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x-0 md:divide-x-2 divide-[#171717] border-b-2 border-[#171717]">
          <div className="p-5 border-b-2 md:border-b-0 border-[#171717]" style={{ background: "#d1fae5" }}>
            <div className="text-[10px] uppercase font-black tracking-widest">Global rank</div>
            <div className="font-display font-black text-3xl sm:text-4xl mt-1" data-testid={CERT.rank}>#{cert.rank}</div>
            <div className="text-xs mt-0.5">of {cert.total_alumni} alumni</div>
          </div>
          <div className="p-5 border-b-2 md:border-b-0 border-[#171717]" style={{ background: "#dbeafe" }}>
            <div className="text-[10px] uppercase font-black tracking-widest">Points</div>
            <div className="font-display font-black text-3xl sm:text-4xl mt-1" data-testid={CERT.points}>{cert.points}</div>
            <div className="text-xs mt-0.5">+10 per verified help</div>
          </div>
          <div className="p-5" style={{ background: "#ffedd5" }}>
            <div className="text-[10px] uppercase font-black tracking-widest">Percentile</div>
            <div className="font-display font-black text-3xl sm:text-4xl mt-1" data-testid={CERT.percentile}>
              {cert.percentile ? `Top ${100 - cert.percentile + 1}%` : "—"}
            </div>
            <div className="text-xs mt-0.5">Community standing</div>
          </div>
          <div className="p-5" style={{ background: "#fff" }}>
            <div className="text-[10px] uppercase font-black tracking-widest">Juniors helped</div>
            <div className="font-display font-black text-3xl sm:text-4xl mt-1">{cert.juniors_helped_total}</div>
            <div className="text-xs mt-0.5">Lifetime</div>
          </div>
        </div>

        {/* SECONDARY GRID */}
        <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="This week" value={cert.week_helped}
            sub={`${cert.week_helped * 10} pts earned`} bg="#fff"
            icon={Flame} testId={CERT.weekHelped}
          />
          <Stat
            label="This month" value={cert.month_helped}
            sub={`${cert.month_helped * 10} pts earned`} bg="#fff"
            icon={TrendingUp} testId={CERT.monthHelped}
          />
          <Stat
            label="Reply time"
            value={cert.avg_reply_minutes != null ? `${cert.avg_reply_minutes}m` : "—"}
            sub={cert.avg_reply_minutes != null ? "avg to first reply" : "Need more chats"}
            bg="#fff"
            icon={Zap} testId={CERT.avgReply}
          />
          <Stat
            label="Weekly streak" value={`${cert.streak_weeks}w`}
            sub={cert.streak_weeks ? "consecutive weeks" : "Help one junior to start"}
            bg="#fff"
            icon={Flame} testId={CERT.streak}
          />
          <Stat
            label="Trusted juniors" value={cert.trusted_count}
            sub="Can DM you anytime" bg="#fff"
            icon={ShieldCheck} testId={CERT.trusted}
          />
          <Stat
            label="Conversations" value={cert.conversations_count}
            sub={`${cert.messages_sent} messages sent`} bg="#fff"
            icon={MessagesSquare}
          />
          <Stat
            label="Last helped" value={fmtRelative(cert.last_helped_at)}
            sub={cert.last_helped_at ? fmtDate(cert.last_helped_at) : "No help logged yet"}
            bg="#fff"
            icon={Calendar}
          />
          <Stat
            label="Working window"
            value={`${cert.working_hours_start}–${cert.working_hours_end}`}
            sub="Daily open hours" bg="#fff"
            icon={Clock}
          />
        </div>

        {/* BADGES */}
        {cert.badges?.length > 0 && (
          <div className="px-5 sm:px-6 pb-5">
            <div className="text-[10px] uppercase font-black tracking-widest mb-2">Earned badges</div>
            <div className="flex flex-wrap gap-2" data-testid={CERT.badges}>
              {cert.badges.map((b, i) => (
                <span key={i} className="aln-chip" style={{ background: BADGE_BG[b.tone] || "#f5f5f5" }}>
                  <Sparkles className="w-3 h-3" /> {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* RECENT JUNIORS HELPED */}
        <div className="border-t-2 border-[#171717] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase font-black tracking-widest">Recent juniors helped</div>
            <span className="text-xs text-[#525252]">
              <Users className="w-3 h-3 inline mr-1" /> Last {cert.recent_helped?.length || 0}
            </span>
          </div>
          {cert.recent_helped?.length ? (
            <ul className="space-y-2" data-testid={CERT.recentList}>
              {cert.recent_helped.map((r, i) => (
                <li key={i} className="aln-card-flat p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg border-2 border-[#171717] flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: "#f5f5f5" }}>
                    {(r.name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{r.name}</div>
                    <div className="text-xs text-[#404040] truncate">
                      {r.school}{r.grade ? ` · Grade ${r.grade}` : ""} · {fmtRelative(r.when)}
                    </div>
                    {r.note && <div className="text-xs text-[#525252] mt-1 line-clamp-2">"{r.note}"</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-[#525252]">
              Nobody's marked you as helpful yet. Reply during working hours to start the loop.
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 border-t-2 border-[#171717] flex items-center justify-between text-sm flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#525252]">Certificate ID</div>
            <div className="font-mono">{cert.certificate_id}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-black tracking-widest text-[#525252]">Issued</div>
            <div className="font-mono">{fmtDate(cert.issued_at)}</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#525252] mt-4 max-w-2xl">
        Every metric is computed live from ID-verified juniors and your reply history — auditable via
        the Certificate ID. Print this to attach to a resume or share the link with a recruiter.
      </p>
    </div>
  );
}
