import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { LEADERBOARD } from "@/constants/testIds";
import { Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

const RANK_BG = ["#fef08a", "#d1fae5", "#dbeafe"];

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leaderboard")
      .then((r) => setRows(r.data))
      .catch((e) => toast.error(formatApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid={LEADERBOARD.root}>
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-6 h-6" />
        <div className="text-xs uppercase tracking-[0.2em] font-black">Global leaderboard</div>
      </div>
      <h1 className="font-display font-black text-3xl lg:text-4xl">The seniors making a dent.</h1>
      <p className="text-sm text-[#404040] mt-1">Every 10 points = one verified junior helped. Top ranks get printable certificates.</p>

      <div className="mt-8 space-y-3">
        {loading && <div className="text-center py-10 text-[#525252]">Loading...</div>}
        {!loading && rows.length === 0 && (
          <div className="aln-card p-8 text-center">
            <p className="font-display font-bold">Nobody's climbed yet — be the first.</p>
          </div>
        )}
        {rows.map((u) => {
          const bg = u.rank <= 3 ? RANK_BG[u.rank - 1] : "#fff";
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
                <div className="font-display font-bold truncate">{u.name}</div>
                <div className="text-xs text-[#404040] truncate">{u.college || "—"} · {u.stream || "—"}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-xl">{u.points || 0}</div>
                <div className="text-xs text-[#525252]">pts</div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-bold aln-chip" style={{ background: "#fff" }}>
                <Flame className="w-3 h-3" /> {u.juniors_helped || 0} helped
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
