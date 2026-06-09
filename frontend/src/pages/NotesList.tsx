import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Upload, BookOpenText, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCachedGoal } from "@/utils/examConfig";
import { isAdmin } from "@/utils/adminUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Note {
  id: string;
  title: string;
  subject: string;
  exam: string;
  pdf_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

const JEE_SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics"];
const NEET_SUBJECTS = ["All", "Physics", "Chemistry", "Botany", "Zoology"];

export default function NotesList() {
  const navigate = useNavigate();
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const subjects = isNEET ? NEET_SUBJECTS : JEE_SUBJECTS;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("All");
  const [search, setSearch] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdmin(isAdmin(user?.email));
    })();
    load();
  }, [isNEET]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_notes" as any)
      .select("*")
      .eq("exam", isNEET ? "NEET" : "JEE")
      .order("created_at", { ascending: false });
    if (!error) setNotes((data as any) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (subject !== "All" && n.subject !== subject) return false;
      if (q && !n.title.toLowerCase().includes(q) && !n.subject.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [notes, subject, search]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{isNEET ? "NEET" : "JEE"} Notes</h1>
            <p className="text-xs text-muted-foreground truncate">Premium PDF notes by subject</p>
          </div>
          {admin && (
            <Button onClick={() => navigate("/admin/notes")} size="sm" className="gap-1.5">
              <Upload className="w-4 h-4" /> Upload
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="container mx-auto px-3 sm:px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by title or subject…"
              className="pl-9 h-10 bg-card/70"
            />
          </div>
        </div>

        {/* Subject filter chips */}
        <div className="container mx-auto px-3 sm:px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {subjects.map((s) => {
              const active = s === subject;
              return (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                      : "bg-card/60 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-3 sm:px-4 py-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Loading notes…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpenText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No notes yet for this filter.</p>
            {admin && (
              <Button onClick={() => navigate("/admin/notes")} className="mt-4">
                <Upload className="w-4 h-4 mr-2" /> Upload First Note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="group relative rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-all"
              >
                <button
                  onClick={() => navigate(`/notes/${n.id}`)}
                  className="block w-full text-left"
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {n.thumbnail_url ? (
                      <img
                        src={n.thumbnail_url}
                        alt={n.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                        <BookOpenText className="w-10 h-10 text-indigo-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-semibold text-white">
                      {n.subject}
                    </div>
                  </div>
                  <div className="p-2.5 pr-10">
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {n.title}
                    </h4>
                  </div>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await fetch(n.pdf_url);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${n.title || "note"}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch {
                      toast.error("Download failed");
                    }
                  }}
                  aria-label="Download PDF"
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/40 hover:scale-110 active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
