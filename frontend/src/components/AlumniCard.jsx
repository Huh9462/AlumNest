import { GraduationCap, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkingHoursPill from "./WorkingHoursPill";
import { ALUMNI } from "@/constants/testIds";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AlumniCard({ alumni, showWhy = false, onHelped }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const initials = (alumni.name || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const handleHelped = async () => {
    try {
      await api.post("/mentor/log-help", { mentor_id: alumni.id });
      toast.success(`+10 points awarded to ${alumni.name}!`);
      onHelped?.(alumni.id);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const goChat = () => {
    if (!user) {
      toast.error("Please sign in to start a chat.");
      nav("/login");
      return;
    }
    nav(`/chat/${alumni.id}`);
  };

  return (
    <div className="aln-card p-5" data-testid={ALUMNI.card(alumni.id)}>
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg border-2 border-[#171717]"
          style={{ background: "#fef08a" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className="font-display font-bold text-xl leading-tight truncate"
              data-testid={ALUMNI.cardName(alumni.id)}
            >
              {alumni.name}
            </h3>
            <div className="aln-chip" style={{ background: "#dbeafe" }}>
              <TrendingUp className="w-3 h-3" /> {alumni.points || 0} pts
            </div>
          </div>
          <p className="text-sm text-[#404040] flex items-center gap-1 mt-1">
            <GraduationCap className="w-4 h-4" />
            {alumni.college || "College TBD"} · {alumni.stream || "—"}
          </p>
          <p className="text-xs text-[#525252] mt-0.5">{alumni.school}</p>
        </div>
      </div>

      {alumni.bio && (
        <p className="text-sm text-[#404040] mt-3 line-clamp-3">{alumni.bio}</p>
      )}

      {showWhy && alumni.why && (
        <div
          className="mt-3 p-3 border-2 border-[#171717] rounded-lg text-sm"
          style={{ background: "#d1fae5" }}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
            <span><b>AluPal:</b> {alumni.why}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-4">
        <WorkingHoursPill
          start={alumni.working_hours_start}
          end={alumni.working_hours_end}
          testId={`alumni-hours-${alumni.id}`}
        />
        <div className="flex gap-2">
          {user?.role === "junior" && (
            <button
              className="aln-btn-secondary text-sm"
              onClick={handleHelped}
              data-testid={ALUMNI.helpedBtn(alumni.id)}
              title="Log that this mentor helped you (+10 pts)"
            >
              <Sparkles className="w-4 h-4" /> They helped me
            </button>
          )}
          <button
            className="aln-btn-primary text-sm"
            data-testid={ALUMNI.chatBtn(alumni.id)}
            onClick={goChat}
          >
            <MessageCircle className="w-4 h-4" /> Chat
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-[#525252] flex items-center gap-3">
        <span>Helped <b className="text-[#171717]">{alumni.juniors_helped || 0}</b> juniors</span>
        {alumni.streak_days > 0 && <span>· {alumni.streak_days}-day streak</span>}
      </div>
    </div>
  );
}
