import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LEADERBOARD } from "@/constants/testIds";
import { Trophy, Flame, Filter } from "lucide-react";
import { toast } from "sonner";

const RANK_BG = ["#fef08a", "#d1fae5", "#dbeafe"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("all");
  const [school, setSchool] = useState("");
  const [schools, setSchools] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { scope };
      if (school) params.school = school;
      const { data } = await api.get("/leaderboard", { params });
      setRows(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    api.get("/leaderboard/schools").then((r) => setSchools(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope, school]);

  const selfRow = useMemo(
    () => (user ? rows.find((r) => r.id === user.id) : null),
    [rows, user]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid={LEADERBOARD.root}>
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-6 h-6" />
        <div className="text-xs uppercase tracking-[0.2em] font-black">Global leaderboard</div>
      </div>
      <h1 className="font-display font-black text-3xl lg:text-4xl">The seniors making a dent.</h1>
      <p className="text-sm text-[#404040] mt-1">
        Every 10 points = one verified junior helped. Top ranks get printable certificates.
      </p>

      {/* Filter bar */}
      <div className="aln-card p-4 mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs uppercase font-black tracking-widest mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Scope
            </div>
            <div className="flex rounded-full overflow-hidden border-2 border-[#171717]">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-4 py-1.5 text-sm font-bold ${scope === "all" ? "bg-[#171717] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                data-testid={LEADERBOARD.scopeAll}
              >
                All-time
              </button>
              <button
                type="button"
                onClick={() => setScope("week")}
                className={`px-4 py-1.5 text-sm font-bold border-l-2 border-[#171717] ${scope === "week" ? "bg-[#171717] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                data-testid={LEADERBOARD.scopeWeek}
              >
                This week
              </button>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs uppercase font-black tracking-widest mb-1">School</div>
            <select
              className="aln-input"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              data-testid={LEADERBOARD.schoolFilter}
            >
              <option value="">All schools</option>
              {schools.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Self callout */}
      {user?.role === "alumni" && selfRow && (
        <div
          className="aln-card p-4 mt-6 flex items-center gap-4"
          style={{ background: "#d1fae5" }}
          data-testid={LEADERBOARD.selfCallout}
        >
          <div className="font-display font-black text-2xl w-10 text-center">#{selfRow.rank}</div>
          <div className="flex-1">
            <div className="font-display font-bold">You're on the board — keep going.</div>
            <div className="text-xs text-[#404040]">
              {scope === "week"
                ? `${selfRow.week_helped || 0} ${(selfRow.week_helped || 0) === 1 ? "junior" : "juniors"} helped this week · ${selfRow.week_points || 0} pts`
                : `${selfRow.juniors_helped || 0} ${(selfRow.juniors_helped || 0) === 1 ? "junior" : "juniors"} helped · ${selfRow.points || 0} pts`}
            </div>
          </div>
          <Link to="/certificate" className="aln-btn-secondary text-sm">See my card</Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading && <div className="text-center py-10 text-[#525252]">Loading...</div>}
        {!loading && rows.length === 0 && (
          <div className="aln-card p-8 text-center">
            <p className="font-display font-bold">
              {scope === "week" ? "Nobody's helped a junior this week yet." : "Nobody's climbed yet — be the first."}
            </p>
          </div>
        )}
        {rows.map((u) => {
          const bg = u.rank <= 3 ? RANK_BG[u.rank - 1] : (user?.id === u.id ? "#d1fae5" : "#fff");
          const pts = scope === "week" ? (u.week_points || 0) : (u.points || 0);
          const helped = scope === "week" ? (u.week_helped || 0) : (u.juniors_helped || 0);
          return (
            <div
              key={u.id}
              className="aln-card p-4 flex items-center gap-4"
              style={{ background: bg }}
              data-testid={LEADERBOARD.row(u.id)}
            >
              <div className="font-display font-black text-2xl w-10 text-center">#{u.rank}</div>
              <div className="w-11 h-11 rounded-lg border-2 border-[#171717] flex items-center justify-center font-black"
                style={{ background: "#fff" }}>
                {(u.name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold truncate flex items-center gap-2">
                  {u.name}
                  {user?.id === u.id && <span className="aln-chip text-[10px]" style={{ background: "#fef08a" }}>You</span>}
                </div>
                <div className="text-xs text-[#404040] truncate">{u.college || "—"} · {u.stream || "—"} · {u.school}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-xl">{pts}</div>
                <div className="text-xs text-[#525252]">pts</div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-bold aln-chip" style={{ background: "#fff" }}>
                <Flame className="w-3 h-3" /> {helped} helped
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
