import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      nav(data.user.role === "junior" ? "/alupal" : "/alumni");
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="aln-card p-8">
        <h1 className="font-display font-black text-3xl">Welcome back</h1>
        <p className="text-sm text-[#404040] mt-1">Log in to keep helping (or being helped).</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase font-black tracking-widest">Email</label>
            <input type="email" required className="aln-input mt-1" value={email}
              onChange={(e) => setEmail(e.target.value)} data-testid={AUTH.emailInput} />
          </div>
          <div>
            <label className="text-xs uppercase font-black tracking-widest">Password</label>
            <input type="password" required className="aln-input mt-1" value={password}
              onChange={(e) => setPassword(e.target.value)} data-testid={AUTH.passwordInput} />
          </div>
          {err && <div className="text-sm text-[#ef4444] font-bold" data-testid={AUTH.errorMsg}>{err}</div>}
          <button className="aln-btn-primary w-full justify-center" disabled={busy} data-testid={AUTH.submitBtn}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-[#404040] mt-4">
          New to Alumnest? <Link to="/signup" className="font-bold underline" data-testid={AUTH.switchModeLink}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
