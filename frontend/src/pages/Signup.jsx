import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Signup() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    email: "", password: "", name: "", role: "junior", school: "",
    grade: "12", college: "", stream: "", bio: "",
    working_hours_start: "14:00", working_hours_end: "16:00",
  });
  const [idCard, setIdCard] = useState("");
  const [idCardName, setIdCardName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setErr("ID image must be under 4MB"); return; }
    const b64 = await fileToBase64(file);
    setIdCard(b64);
    setIdCardName(file.name);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!idCard) { setErr("Please upload your student/university ID card."); return; }
    setBusy(true);
    try {
      const payload = { ...f, id_card_base64: idCard };
      if (f.role === "alumni") delete payload.grade;
      if (f.role === "junior") { /* keep grade */ }
      const { data } = await api.post("/auth/register", payload);
      login(data.token, data.user);
      toast.success("Welcome to Alumnest!");
      nav(data.user.role === "junior" ? "/alupal" : "/alumni");
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="aln-card p-8">
        <h1 className="font-display font-black text-3xl">Join Alumnest</h1>
        <p className="text-sm text-[#404040] mt-1">
          Verified students only. Upload your ID to keep the community real and safe.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setF({ ...f, role: "junior" })}
              className={`aln-card-flat p-4 text-left ${f.role === "junior" ? "" : "opacity-60"}`}
              style={{ background: f.role === "junior" ? "#d1fae5" : "#fff" }}
              data-testid={AUTH.roleJunior}
            >
              <div className="font-display font-bold">I'm a Junior</div>
              <div className="text-xs mt-1">Grades 9–12 · looking for guidance</div>
            </button>
            <button
              type="button"
              onClick={() => setF({ ...f, role: "alumni" })}
              className={`aln-card-flat p-4 text-left ${f.role === "alumni" ? "" : "opacity-60"}`}
              style={{ background: f.role === "alumni" ? "#dbeafe" : "#fff" }}
              data-testid={AUTH.roleAlumni}
            >
              <div className="font-display font-bold">I'm an Alumni</div>
              <div className="text-xs mt-1">College student · ready to mentor</div>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase font-black tracking-widest">Full name</label>
              <input required className="aln-input mt-1" value={f.name} onChange={set("name")} data-testid={AUTH.nameInput} />
            </div>
            <div>
              <label className="text-xs uppercase font-black tracking-widest">Email</label>
              <input type="email" required className="aln-input mt-1" value={f.email} onChange={set("email")} data-testid={AUTH.emailInput} />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-black tracking-widest">Password (min 6)</label>
            <input type="password" required minLength={6} className="aln-input mt-1" value={f.password} onChange={set("password")} data-testid={AUTH.passwordInput} />
          </div>

          <div>
            <label className="text-xs uppercase font-black tracking-widest">School</label>
            <input required className="aln-input mt-1" placeholder="e.g. Lighthouse Prep, Mumbai"
              value={f.school} onChange={set("school")} data-testid={AUTH.schoolInput} />
          </div>

          {f.role === "junior" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase font-black tracking-widest">Grade</label>
                <select className="aln-input mt-1" value={f.grade} onChange={set("grade")} data-testid={AUTH.gradeSelect}>
                  <option value="9">9th</option>
                  <option value="10">10th</option>
                  <option value="11">11th</option>
                  <option value="12">12th</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase font-black tracking-widest">Stream (optional)</label>
                <input className="aln-input mt-1" placeholder="Science / Commerce / Arts"
                  value={f.stream} onChange={set("stream")} data-testid={AUTH.streamInput} />
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase font-black tracking-widest">Your college</label>
                  <input required className="aln-input mt-1" placeholder="e.g. IIT Bombay"
                    value={f.college} onChange={set("college")} data-testid={AUTH.collegeInput} />
                </div>
                <div>
                  <label className="text-xs uppercase font-black tracking-widest">Stream / branch</label>
                  <input required className="aln-input mt-1" placeholder="Computer Science"
                    value={f.stream} onChange={set("stream")} data-testid={AUTH.streamInput} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase font-black tracking-widest">Working hours start</label>
                  <input type="time" className="aln-input mt-1" value={f.working_hours_start}
                    onChange={set("working_hours_start")} data-testid={AUTH.whStart} />
                </div>
                <div>
                  <label className="text-xs uppercase font-black tracking-widest">Working hours end</label>
                  <input type="time" className="aln-input mt-1" value={f.working_hours_end}
                    onChange={set("working_hours_end")} data-testid={AUTH.whEnd} />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-black tracking-widest">Short bio</label>
                <textarea className="aln-input mt-1" rows={3}
                  placeholder="What can juniors ask you about?"
                  value={f.bio} onChange={set("bio")} data-testid={AUTH.bioInput} />
              </div>
            </>
          )}

          <div>
            <label className="text-xs uppercase font-black tracking-widest">
              Upload School / University ID card
            </label>
            <label className="mt-1 aln-card-flat p-4 flex items-center justify-between cursor-pointer" style={{ background: "#fef08a" }}>
              <div className="flex items-center gap-3">
                {idCard ? <CheckCircle2 className="w-5 h-5 text-green-700" /> : <Upload className="w-5 h-5" />}
                <div>
                  <div className="font-bold text-sm">{idCard ? "ID uploaded" : "Choose image"}</div>
                  <div className="text-xs text-[#525252]">{idCardName || "PNG/JPG, under 4MB. Kept private."}</div>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onFile} data-testid={AUTH.idCardInput} />
              <span className="aln-btn-secondary text-xs">Browse</span>
            </label>
          </div>

          {err && <div className="text-sm text-[#ef4444] font-bold" data-testid={AUTH.errorMsg}>{err}</div>}
          <button className="aln-btn-primary w-full justify-center" disabled={busy} data-testid={AUTH.submitBtn}>
            {busy ? "Creating account..." : "Create my account"}
          </button>
        </form>
        <p className="text-sm text-[#404040] mt-4">
          Already have an account? <Link to="/login" className="font-bold underline" data-testid={AUTH.switchModeLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
