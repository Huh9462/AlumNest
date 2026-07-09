import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import AlumniCard from "@/components/AlumniCard";
import { ALUMNI } from "@/constants/testIds";
import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function Alumni() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [college, setCollege] = useState("");
  const [stream, setStream] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (college) params.college = college;
      if (stream) params.stream = stream;
      const { data } = await api.get("/alumni", { params });
      setItems(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-black">Mentors</div>
          <h1 className="font-display font-bold text-3xl lg:text-4xl mt-1">Real seniors, real hours.</h1>
          <p className="text-sm text-[#404040] mt-1">Filter by the college you're aiming for.</p>
        </div>
      </div>

      <div className="aln-card p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs uppercase font-black tracking-widest">Search</label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]" />
              <input className="aln-input pl-9" placeholder="Name, college, school"
                value={q} onChange={(e) => setQ(e.target.value)} data-testid={ALUMNI.filterSearch} />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase font-black tracking-widest">College</label>
            <input className="aln-input mt-1" placeholder="IIT, AIIMS, NLSIU..."
              value={college} onChange={(e) => setCollege(e.target.value)} data-testid={ALUMNI.filterCollege} />
          </div>
          <div>
            <label className="text-xs uppercase font-black tracking-widest">Stream</label>
            <input className="aln-input mt-1" placeholder="CS, Medical, Law..."
              value={stream} onChange={(e) => setStream(e.target.value)} data-testid={ALUMNI.filterStream} />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="aln-btn-primary text-sm" onClick={load} data-testid={ALUMNI.applyBtn}>
            <SlidersHorizontal className="w-4 h-4" /> Apply filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#525252]">Loading mentors...</div>
      ) : items.length === 0 ? (
        <div className="aln-card p-10 text-center">
          <p className="font-display font-bold text-xl">No mentors match those filters.</p>
          <p className="text-sm text-[#404040] mt-1">Try broadening the search — or invite a senior to join.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid={ALUMNI.list}>
          {items.map((a) => (<AlumniCard key={a.id} alumni={a} onHelped={load} />))}
        </div>
      )}
    </div>
  );
}
