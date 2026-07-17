import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";
import { Mail, IdCard } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("email"); // "email" | "argus"

  // email form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // argus form
  const [argusId, setArgusId] = useState("");
  const [argusPw, setArgusPw] = useState("");
  const [argusRole, setArgusRole] = useState("student");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const routeAfter = (u) => nav(u.role === "junior" ? "/alupal" : "/alumni");

  const submitEmail = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      routeAfter(data.user);
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setBusy(false); }
  };

  const submitArgus = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/auth/argus-login", {
        argus_id: argusId,
        argus_password: argusPw,
        argus_role: argusRole,
      });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      routeAfter(data.user);
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setBusy(false); }
  };

  const tabBtn = (id, label, icon, testId) => (
    <button
      type="button"
      onClick={() => { setTab(id); setErr(""); }}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold border-2 border-[#171717] transition-colors ${
        tab === id ? "bg-[#171717] text-white" : "bg-white hover:bg-[#f5f5f5]"
      }`}
      data-testid={testId}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="aln-card p-8">
        <h1 className="font-display font-black text-3xl">Welcome back</h1>
        <p className="text-sm text-[#404040] mt-1">Log in to keep helping (or being helped).</p>

        <div className="mt-6 flex rounded-full overflow-hidden border-2 border-[#171717]">
          {tabBtn("email", "School email", <Mail className="w-4 h-4" />, AUTH.tabEmail)}
          {tabBtn("argus", "Argus ID", <IdCard className="w-4 h-4" />, AUTH.tabArgus)}
        </div>

        {tab === "email" ? (
          <form onSubmit={submitEmail} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase font-black tracking-widest">School email</label>
              <input
                type="email" required className="aln-input mt-1"
                placeholder="you@yourschool.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid={AUTH.emailInput}
              />
            </div>
            <div>
              <label className="text-xs uppercase font-black tracking-widest">Password</label>
              <input
                type="password" required className="aln-input mt-1"
                value={password} onChange={(e) => setPassword(e.target.value)}
                data-testid={AUTH.passwordInput}
              />
            </div>
            {err && <div className="text-sm text-[#ef4444] font-bold" data-testid={AUTH.errorMsg}>{err}</div>}
            <button className="aln-btn-primary w-full justify-center" disabled={busy} data-testid={AUTH.submitBtn}>
              {busy ? "Signing in..." : "Sign in with school email"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitArgus} className="mt-6 space-y-4">
            <div className="flex items-center gap-3 aln-card-flat p-3" style={{ background: "#dbeafe" }}>
              <IdCard className="w-8 h-8 shrink-0" strokeWidth={2.2} />
              <div className="text-xs text-[#171717]">
                Sign in with your <b>Argus</b> (EuroSchool by Lighthouse Learning) ID and the Argus
                password you set when signing up to Alumnest.
              </div>
            </div>
            <div>
              <label className="text-xs uppercase font-black tracking-widest">I am a</label>
              <select
                className="aln-input mt-1" value={argusRole}
                onChange={(e) => setArgusRole(e.target.value)}
                data-testid={AUTH.argusRole}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-black tracking-widest">
                Enrollment # / Phone / User ID
              </label>
              <input
                required className="aln-input mt-1"
                placeholder="e.g. 24051234 or +91 98xxxxxxxx"
                value={argusId} onChange={(e) => setArgusId(e.target.value)}
                data-testid={AUTH.argusId}
              />
            </div>
            <div>
              <label className="text-xs uppercase font-black tracking-widest">Argus password</label>
              <input
                type="password" required className="aln-input mt-1"
                value={argusPw} onChange={(e) => setArgusPw(e.target.value)}
                data-testid={AUTH.argusPassword}
              />
            </div>
            {err && <div className="text-sm text-[#ef4444] font-bold" data-testid={AUTH.errorMsg}>{err}</div>}
            <button className="aln-btn-primary w-full justify-center" disabled={busy} data-testid={AUTH.argusSubmit}>
              {busy ? "Signing in..." : "Proceed with Argus"}
            </button>
            <p className="text-xs text-[#525252]">
              Haven't linked Argus yet? Sign up and choose <b>"Link my Argus account"</b> during registration.
            </p>
          </form>
        )}

        <p className="text-sm text-[#404040] mt-4">
          New to Alumnest? <Link to="/signup" className="font-bold underline" data-testid={AUTH.switchModeLink}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
