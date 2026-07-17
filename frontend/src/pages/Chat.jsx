import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CHAT } from "@/constants/testIds";
import WorkingHoursPill from "@/components/WorkingHoursPill";
import { Send, Lock, Shield, ShieldCheck, ArrowLeft, MessagesSquare, Flag } from "lucide-react";
import { toast } from "sonner";
import ReportDialog from "@/components/ReportDialog";

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function initials(name) {
  return (name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function ConversationsPanel({ conversations, activeId, onPick }) {
  return (
    <div className="aln-card-flat h-full overflow-y-auto" data-testid={CHAT.convList}>
      <div className="p-4 border-b-2 border-[#171717] flex items-center gap-2">
        <MessagesSquare className="w-5 h-5" />
        <div className="font-display font-bold">Conversations</div>
      </div>
      {conversations.length === 0 && (
        <div className="p-6 text-sm text-[#525252]">
          No chats yet. Head to Mentors and start one.
        </div>
      )}
      {conversations.map((c) => {
        const active = c.other.id === activeId;
        return (
          <button
            key={c.conversation_id}
            className={`w-full text-left p-4 border-b border-[#171717]/20 flex gap-3 items-start ${
              active ? "bg-[#fef08a]" : "hover:bg-[#f5f5f5]"
            }`}
            onClick={() => onPick(c.other.id)}
            data-testid={CHAT.conv(c.other.id)}
          >
            <div className="w-10 h-10 shrink-0 rounded-lg border-2 border-[#171717] flex items-center justify-center font-black text-sm"
              style={{ background: "#d1fae5" }}>
              {initials(c.other.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-display font-bold truncate">{c.other.name}</div>
                {c.unread > 0 && (
                  <span className="aln-chip text-[10px]" style={{ background: "#22c55e", color: "#fff" }}>
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="text-xs text-[#404040] truncate">
                {c.last_message.text}
              </div>
              <div className="text-[10px] text-[#525252] mt-0.5">{fmtTime(c.last_message.created_at)}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ThreadPanel({ otherId }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [trusting, setTrusting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef(null);
  const [pending, setPending] = useState([]);

  const load = async () => {
    try {
      const r = await api.get(`/chat/messages/${otherId}`);
      setData(r.data);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  useEffect(() => {
    setData(null);
    setPending([]);
    load();
    const id = setInterval(load, 3500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [data?.messages?.length, pending.length]);

  if (!data) {
    return <div className="aln-card-flat h-full flex items-center justify-center text-[#525252]">Loading...</div>;
  }

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    if (!data.can_send_now) {
      toast.error("Working hours are closed. You'll be able to send once the window opens.");
      return;
    }
    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_id: user.id,
      recipient_id: otherId,
      text: text.trim(),
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setPending((p) => [...p, optimistic]);
    setText("");
    setBusy(true);
    try {
      await api.post("/chat/send", { recipient_id: otherId, text: optimistic.text });
      setPending((p) => p.filter((m) => m.id !== optimistic.id));
      load();
    } catch (e) {
      setPending((p) => p.filter((m) => m.id !== optimistic.id));
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleTrust = async () => {
    if (trusting) return;
    setTrusting(true);
    try {
      if (data.is_trusted) {
        await api.delete(`/chat/trusted/${otherId}`);
        toast.success(`${data.other.name} removed from trusted`);
      } else {
        await api.post(`/chat/trusted/${otherId}`);
        toast.success(`${data.other.name} added as trusted — they can DM anytime`);
      }
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setTrusting(false); }
  };

  const other = data.other;
  const allMessages = [...(data.messages || []), ...pending];
  const isAlumni = user.role === "alumni";
  const nextOpen = data.next_open_in_min;
  const openIn = nextOpen == null
    ? ""
    : nextOpen === 0 ? "now" : `${Math.floor(nextOpen / 60)}h ${nextOpen % 60}m`;

  return (
    <div className="aln-card-flat h-full flex flex-col">
      <div className="p-4 border-b-2 border-[#171717] flex items-center gap-3" data-testid={CHAT.header}>
        <div className="w-10 h-10 rounded-lg border-2 border-[#171717] flex items-center justify-center font-black text-sm"
          style={{ background: "#dbeafe" }}>
          {initials(other.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold truncate">{other.name}</div>
          <div className="text-xs text-[#404040] truncate">
            {other.college || other.school} {other.stream ? `· ${other.stream}` : ""}
          </div>
        </div>
        {other.role === "alumni" && (
          <WorkingHoursPill
            start={other.working_hours_start}
            end={other.working_hours_end}
            testId={`chat-hours-${other.id}`}
          />
        )}
        {isAlumni && other.role === "junior" && (
          <button
            onClick={toggleTrust}
            className={data.is_trusted ? "aln-btn-mint text-xs" : "aln-btn-secondary text-xs"}
            data-testid={CHAT.trustToggle}
            disabled={trusting}
            title="Trusted juniors can DM you anytime"
          >
            {data.is_trusted ? (<><ShieldCheck className="w-4 h-4" /> Trusted</>) : (<><Shield className="w-4 h-4" /> Add trusted</>)}
          </button>
        )}
        {!isAlumni && (
          <button
            onClick={() => setReportOpen(true)}
            className="w-9 h-9 rounded-full border-2 border-[#171717] flex items-center justify-center hover:bg-[#ffedd5] transition-colors"
            aria-label={`Report ${other.name}`}
            title="Report abuse or ghosting"
            data-testid={CHAT.reportBtn}
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2" data-testid={CHAT.thread}>
        {allMessages.length === 0 && (
          <div className="text-center text-sm text-[#525252] py-10">
            Say hello. Be kind — respect their working hours.
          </div>
        )}
        {allMessages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={CHAT.message(m.id)}>
              <div
                className="max-w-[75%] px-4 py-2 border-2 border-[#171717] rounded-2xl text-sm whitespace-pre-wrap break-words"
                style={{ background: mine ? "#fef08a" : "#fff", opacity: m._pending ? 0.6 : 1 }}
              >
                {m.text}
                <div className="text-[10px] text-[#525252] mt-1 text-right">{fmtTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {!data.can_send_now ? (
        <div
          className="p-4 border-t-2 border-[#171717] flex items-center gap-3 text-sm"
          style={{ background: "#ffedd5" }}
          data-testid={CHAT.closedBanner}
        >
          <Lock className="w-5 h-5" />
          <div>
            <b>{other.name}'s working hours are closed.</b> Opens in <b>{openIn}</b>
            {" "}({other.working_hours_start}–{other.working_hours_end}). Reach out then.
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="p-3 border-t-2 border-[#171717] flex gap-2">
          <input
            className="aln-input flex-1"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid={CHAT.input}
            maxLength={2000}
          />
          <button className="aln-btn-primary" disabled={busy || !text.trim()} data-testid={CHAT.sendBtn}>
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
      {reportOpen && (
        <ReportDialog
          reportedUser={other}
          conversationId={`${user.id}_${other.id}`}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}

export default function Chat() {
  const { user, loading } = useAuth();
  const { userId } = useParams();
  const nav = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [showList, setShowList] = useState(true);

  const load = async () => {
    try {
      const r = await api.get("/chat/conversations");
      setConversations(r.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [user]);

  // If a userId is provided but no conversation exists yet, create a stub in the list
  const activeUserId = userId;
  const activeInList = useMemo(
    () => conversations.some((c) => c.other.id === activeUserId),
    [conversations, activeUserId]
  );

  useEffect(() => {
    if (!activeUserId || activeInList) return;
    // fetch counterpart & inject stub so left rail shows something
    api.get(`/alumni/${activeUserId}`).then((r) => {
      setConversations((prev) => (
        prev.some((c) => c.other.id === activeUserId)
          ? prev
          : [{
              conversation_id: `${user?.id}_${activeUserId}`,
              other: r.data,
              last_message: { text: "Start the conversation…", sender_id: "", created_at: new Date().toISOString() },
              unread: 0,
            }, ...prev]
      ));
    }).catch(() => {});
    // eslint-disable-next-line
  }, [activeUserId, activeInList]);

  useEffect(() => { setShowList(!activeUserId); }, [activeUserId]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const pick = (id) => nav(`/chat/${id}`);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6" data-testid={CHAT.root}>
      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-140px)] min-h-[560px]">
        <div className={`${showList || !activeUserId ? "block" : "hidden md:block"}`}>
          <ConversationsPanel
            conversations={conversations}
            activeId={activeUserId}
            onPick={pick}
          />
        </div>
        <div className={`${activeUserId ? "block" : "hidden md:block"}`}>
          {activeUserId ? (
            <div className="h-full flex flex-col">
              <button
                onClick={() => nav("/chat")}
                className="md:hidden mb-2 text-sm font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex-1"><ThreadPanel otherId={activeUserId} /></div>
            </div>
          ) : (
            <div className="aln-card-flat h-full flex items-center justify-center p-8 text-center" data-testid={CHAT.emptyState}>
              <div>
                <MessagesSquare className="w-10 h-10 mx-auto mb-3" />
                <div className="font-display font-bold text-xl">Pick a conversation</div>
                <p className="text-sm text-[#404040] mt-1 max-w-sm">
                  Or head to <b>Mentors</b> and tap <b>Chat</b> on any alumni card. Juniors can only
                  DM during a mentor's working hours — unless they've been added as trusted.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
