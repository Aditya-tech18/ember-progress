import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/utils/adminUtils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePdfThumbnail } from "@/lib/pdfThumb";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Botany", "Zoology"];
const EXAMS = ["JEE", "NEET"];

interface Note {
  id: string;
  title: string;
  subject: string;
  exam: string;
  pdf_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export default function AdminNotesUpload() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [exam, setExam] = useState("JEE");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const ok = isAdmin(user?.email);
      setAuthorized(ok);
      if (!ok) {
        toast.error("Admin access required");
        navigate("/notes");
        return;
      }
      load();
    })();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("study_notes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setNotes((data as any) || []);
  };

  const handleUpload = async () => {
    if (!title.trim() || !subject || !exam || !file) {
      toast.error("Please fill all fields and choose a PDF");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const stamp = Date.now();
      const safe = title.replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
      const basePath = `${exam}/${subject}/${stamp}_${safe}`;
      const pdfPath = `${basePath}.pdf`;
      const thumbPath = `${basePath}.jpg`;

      // 1. Upload PDF
      const { error: upErr } = await supabase.storage
        .from("study_notes")
        .upload(pdfPath, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (upErr) throw upErr;

      // 2. Generate + upload thumbnail (first page)
      let thumbUrl: string | null = null;
      try {
        const thumb = await generatePdfThumbnail(file);
        const { error: thErr } = await supabase.storage
          .from("study_notes")
          .upload(thumbPath, thumb, { contentType: "image/jpeg", upsert: true });
        if (!thErr) {
          thumbUrl = supabase.storage.from("study_notes").getPublicUrl(thumbPath).data.publicUrl;
        }
      } catch (e) {
        console.warn("thumbnail generation failed", e);
      }

      const pdfUrl = supabase.storage.from("study_notes").getPublicUrl(pdfPath).data.publicUrl;

      // 3. Insert record
      const { error: insErr } = await supabase.from("study_notes" as any).insert({
        title: title.trim(),
        subject,
        exam,
        pdf_url: pdfUrl,
        thumbnail_url: thumbUrl,
        uploaded_by: user?.id,
        uploader_email: user?.email,
      });
      if (insErr) throw insErr;

      toast.success("Note uploaded!");
      setTitle("");
      setFile(null);
      (document.getElementById("notes-pdf-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("notes-pdf-input") as HTMLInputElement).value = "");
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (n: Note) => {
    if (!confirm(`Delete "${n.title}"?`)) return;
    try {
      // Best-effort storage removal (path inferred from URL)
      const pdfPath = n.pdf_url.split("/study_notes/")[1];
      const thumbPath = n.thumbnail_url?.split("/study_notes/")[1];
      const paths = [pdfPath, thumbPath].filter(Boolean) as string[];
      if (paths.length) await supabase.storage.from("study_notes").remove(paths);
      await supabase.from("study_notes" as any).delete().eq("id", n.id);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  if (authorized === null) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">Upload Notes</h1>
            <p className="text-xs text-muted-foreground">Admin · Add new PDF notes for students</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 space-y-6">
        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Notes Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kinematics Complete Notes"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Exam</Label>
              <Select value={exam} onValueChange={setExam}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAMS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes-pdf-input">PDF File</Label>
            <Input
              id="notes-pdf-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Uploading…" : "Upload Note"}
          </Button>
        </div>

        {/* Existing notes */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Uploaded Notes ({notes.length})
          </h2>
          {notes.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-10 border border-dashed border-border rounded-lg">
              No notes yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="aspect-[3/4] bg-muted">
                    {n.thumbnail_url ? (
                      <img src={n.thumbnail_url} alt={n.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-semibold line-clamp-2">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground">{n.exam} · {n.subject}</p>
                    <Button
                      onClick={() => handleDelete(n)}
                      size="sm"
                      variant="destructive"
                      className="w-full h-7 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
