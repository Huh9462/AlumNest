import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Fires a browser notification (with in-app toast fallback) 15 min before
// any favourited mentor's working-hours window opens. Runs while user is signed in.
export default function FavouritesReminder() {
  const { user } = useAuth();
  const firedRef = useRef({}); // { mentorId_dateKey_bucket: true }

  useEffect(() => {
    if (!user || user.role !== "junior") return;

    const check = async () => {
      let favs = [];
      try {
        const r = await api.get("/favourites");
        favs = r.data || [];
      } catch { return; }

      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10);

      for (const m of favs) {
        // next_open_in_min = 0 when live, positive when closed
        const mins = m.next_open_in_min;
        if (mins == null) continue;
        // Fire ONCE when 15±1 minutes before window opens
        if (m.available_now) continue;
        if (mins > 16 || mins < 14) continue;
        const key = `${m.id}_${dateKey}_${m.working_hours_start}`;
        if (firedRef.current[key]) continue;
        firedRef.current[key] = true;

        const title = `${m.name} opens in ${mins} min`;
        const body = `Their working hours are ${m.working_hours_start}–${m.working_hours_end}. Get your question ready.`;

        // Native browser notification
        try {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico", tag: key });
          }
        } catch { /* ignore */ }
        // In-app toast fallback (always shown)
        toast(title, { description: body, duration: 8000 });
      }
    };

    // request permission gently (only once)
    try {
      if ("Notification" in window && Notification.permission === "default") {
        // fire-and-forget; browsers ignore this if not triggered by user gesture in some settings
        Notification.requestPermission().catch(() => {});
      }
    } catch { /* ignore */ }

    check();
    const id = setInterval(check, 60_000); // every minute
    return () => clearInterval(id);
  }, [user]);

  return null;
}
