import { useEffect, useState } from "react";

function hmToMinutes(hm) {
  if (!hm) return null;
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function fmtDuration(mins) {
  if (mins <= 0) return "now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function WorkingHoursPill({ start, end, testId }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const s = hmToMinutes(start);
  const e = hmToMinutes(end);
  if (s == null || e == null) {
    return <span className="aln-chip" style={{ background: "#f5f5f5" }} data-testid={testId}>Hours TBD</span>;
  }
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let available;
  if (s <= e) available = nowMin >= s && nowMin <= e;
  else available = nowMin >= s || nowMin <= e;

  if (available) {
    return (
      <span className="aln-chip" style={{ background: "#22c55e", color: "#fff" }} data-testid={testId}>
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" /> Live now · {start}–{end}
      </span>
    );
  }
  // compute time until next window
  let diff = s - nowMin;
  if (diff < 0) diff += 24 * 60;
  return (
    <span className="aln-chip" style={{ background: "#f5f5f5" }} data-testid={testId}>
      Opens in {fmtDuration(diff)} · {start}–{end}
    </span>
  );
}
