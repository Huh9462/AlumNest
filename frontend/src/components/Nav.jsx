import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { NAV } from "@/constants/testIds";
import { LogOut, Sparkles, MessageCircle } from "lucide-react";

export default function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let cancelled = false;
    const load = () => {
      api.get("/chat/conversations").then((r) => {
        if (cancelled) return;
        setUnread((r.data || []).reduce((a, c) => a + (c.unread || 0), 0));
      }).catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  const linkCls = ({ isActive }) =>
    "px-3 py-1.5 rounded-full text-sm font-bold border-2 border-transparent transition-colors " +
    (isActive
      ? "bg-[#171717] text-white"
      : "text-[#171717] hover:bg-[#f5f5f5] hover:border-[#171717]");

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#fafafa]/85 border-b-2 border-[#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display font-black text-xl" data-testid={NAV.brand}>
          <span
            className="w-8 h-8 rounded-lg border-2 border-[#171717] flex items-center justify-center"
            style={{ background: "#d1fae5" }}
          >
            <Sparkles className="w-4 h-4" />
          </span>
          Alumnest
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/alumni" className={linkCls} data-testid={NAV.linkAlumni}>Mentors</NavLink>
          <NavLink to="/alupal" className={linkCls} data-testid={NAV.linkAluPal}>AluPal AI</NavLink>
          <NavLink to="/leaderboard" className={linkCls} data-testid={NAV.linkLeaderboard}>Leaderboard</NavLink>
          {user && (
            <NavLink to="/chat" className={linkCls} data-testid={NAV.linkChat}>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-4 h-4" /> Chat
                {unread > 0 && (
                  <span
                    className="ml-1 aln-chip text-[10px]"
                    style={{ background: "#22c55e", color: "#fff" }}
                    data-testid={NAV.chatBadge}
                  >
                    {unread}
                  </span>
                )}
              </span>
            </NavLink>
          )}
          {user && (
            <NavLink to="/certificate" className={linkCls} data-testid={NAV.linkCertificate}>My Card</NavLink>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login" className="aln-btn-secondary text-sm" data-testid={NAV.login}>Log in</Link>
              <Link to="/signup" className="aln-btn-primary text-sm" data-testid={NAV.signup}>Join free</Link>
            </>
          ) : (
            <>
              <span
                className="hidden sm:inline-flex aln-chip"
                style={{ background: "#fef08a" }}
                data-testid={NAV.userChip}
              >
                {user.name} · {user.role}
              </span>
              <button
                className="aln-btn-secondary text-sm"
                onClick={() => { logout(); nav("/"); }}
                data-testid={NAV.logout}
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
