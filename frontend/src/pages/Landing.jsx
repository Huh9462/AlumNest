import { Link } from "react-router-dom";
import { LANDING } from "@/constants/testIds";
import { ArrowRight, Shield, Sparkles, Trophy, Clock, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const collegeChips = [
  "IIT Bombay", "AIIMS Delhi", "SRCC", "NLSIU", "NID Ahmedabad",
  "IIM Ahmedabad", "IIT Delhi", "BITS Pilani", "St Stephen's",
];

export default function Landing() {
  const [stats, setStats] = useState({ alumni: 0, helped: 0 });

  useEffect(() => {
    api.get("/leaderboard").then((r) => {
      const list = r.data || [];
      setStats({
        alumni: list.length,
        helped: list.reduce((a, u) => a + (u.juniors_helped || 0), 0),
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative aln-grain overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="aln-chip mb-5" style={{ background: "#fef08a" }}>
                <Shield className="w-3 h-3" /> ID-verified alumni mentorship
              </span>
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[1.02]">
                College feels scary.
                <br />
                Someone who's <span style={{ background: "#d1fae5", padding: "0 8px", border: "2px solid #171717", borderRadius: 10 }}>been there</span> makes it human.
              </h1>
              <p className="mt-6 text-lg text-[#404040] max-w-xl leading-relaxed">
                Alumnest connects 9–12 graders with verified school alumni who've already cracked
                the admission they're chasing. Ask real questions. During real hours. From real people.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/signup" className="aln-btn-primary" data-testid={LANDING.ctaSignup}>
                  Get started — it's free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/alumni" className="aln-btn-secondary" data-testid={LANDING.ctaBrowse}>
                  Browse mentors <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                <div>
                  <div className="font-display font-black text-2xl">{stats.alumni || "—"}</div>
                  <div className="text-[#525252]">verified alumni</div>
                </div>
                <div>
                  <div className="font-display font-black text-2xl">{stats.helped || "—"}</div>
                  <div className="text-[#525252]">juniors already helped</div>
                </div>
                <div>
                  <div className="font-display font-black text-2xl">2:14 pm</div>
                  <div className="text-[#525252]">avg. next-open window</div>
                </div>
              </div>
            </div>

            {/* HERO BENTO */}
            <div className="lg:col-span-5 grid grid-cols-6 gap-4">
              <div className="col-span-6 aln-card p-5" style={{ background: "#d1fae5" }}>
                <div className="flex items-center justify-between">
                  <div className="font-display font-bold text-lg">AluPal · match me</div>
                  <span className="aln-chip" style={{ background: "#fff" }}><Sparkles className="w-3 h-3" /> AI</span>
                </div>
                <p className="text-sm mt-2">
                  "I want <b>IIT Bombay</b>, taking <b>PCM</b>, JEE 2027..."
                </p>
                <div className="mt-3 border-2 border-[#171717] bg-white rounded-lg p-3 text-sm">
                  <b>Aarav Mehta</b> · IIT Bombay · CS<br />
                  <span className="text-[#404040]">"Strong overlap. Live at 2–4pm today."</span>
                </div>
              </div>
              <div className="col-span-3 aln-card p-4" style={{ background: "#fef08a" }}>
                <Clock className="w-5 h-5" />
                <div className="font-display font-bold mt-2">Working hours</div>
                <p className="text-xs mt-1">Mentors set 2h/day. DMs only open in that window — respect first.</p>
              </div>
              <div className="col-span-3 aln-card p-4" style={{ background: "#dbeafe" }}>
                <Trophy className="w-5 h-5" />
                <div className="font-display font-bold mt-2">Global leaderboard</div>
                <p className="text-xs mt-1">Every mentor earns a printable scorecard for their resume.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee of colleges */}
        <div className="border-y-2 border-[#171717] bg-white overflow-hidden">
          <div className="flex gap-10 py-3 aln-marquee whitespace-nowrap font-display font-bold uppercase text-sm tracking-widest">
            {[...collegeChips, ...collegeChips].map((c, i) => (
              <span key={i} className="flex items-center gap-3">
                {c} <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#171717]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-black">How it works</div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mt-2">Three steps to your senior.</h2>
          </div>
          <Link to="/alupal" className="aln-btn-mint" data-testid={LANDING.ctaAluPal}>
            Try AluPal <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Prove you're real", d: "Upload your school/uni ID. No fake accounts, no bots. Only real students and alumni.", bg: "#ffedd5" },
            { n: "02", t: "Tell AluPal your goal", d: "The college you want, your stream, and a worry. AluPal finds the alumni who lived that path.", bg: "#d1fae5" },
            { n: "03", t: "DM during working hours", d: "Every mentor sets 2h/day. You DM inside that window. Boundaries keep things kind.", bg: "#dbeafe" },
          ].map((s) => (
            <div key={s.n} className="aln-card p-6" style={{ background: s.bg }}>
              <div className="font-display font-black text-4xl">{s.n}</div>
              <div className="font-display font-bold text-xl mt-2">{s.t}</div>
              <p className="text-sm text-[#404040] mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY / PROOF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="aln-card p-8 lg:p-12" style={{ background: "#fff" }}>
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="text-xs uppercase tracking-[0.2em] font-black">Why Alumnest</div>
              <h2 className="font-display font-bold text-3xl lg:text-4xl mt-2 leading-tight">
                Admissions anxiety is <span style={{ borderBottom: "3px solid #ef4444" }}>real</span>.
                Boundaries + peers make it survivable.
              </h2>
              <p className="text-[#404040] mt-4 leading-relaxed">
                ASSOCHAM's survey found 12th graders in India face acute stress during college
                admissions, and 9th–10th graders struggle to pick a stream. We fix both with the
                only people who actually know: your school's own seniors.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["ID verified", "Working hours only", "Report & block", "Points + printable scorecard"].map((c) => (
                  <span key={c} className="aln-chip" style={{ background: "#f5f5f5" }}>{c}</span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="aln-card p-5" style={{ background: "#fef08a" }}>
                <div className="font-display font-black text-3xl">2h</div>
                <div className="text-sm mt-1">Daily working window per mentor</div>
              </div>
              <div className="aln-card p-5" style={{ background: "#d1fae5" }}>
                <div className="font-display font-black text-3xl">+10</div>
                <div className="text-sm mt-1">Points per verified junior helped</div>
              </div>
              <div className="aln-card p-5" style={{ background: "#dbeafe" }}>
                <div className="font-display font-black text-3xl">01</div>
                <div className="text-sm mt-1">Card that goes on your resume</div>
              </div>
              <div className="aln-card p-5" style={{ background: "#ffedd5" }}>
                <div className="font-display font-black text-3xl">∞</div>
                <div className="text-sm mt-1">Real seniors, not strangers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-[#171717] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between text-sm">
          <span className="font-display font-bold">Alumnest · built for Lighthouse Group schools</span>
          <span className="text-[#525252]">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
