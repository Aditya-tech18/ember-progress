import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pdfjsLib } from "@/lib/pdfThumb";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  subject: string;
  pdf_url: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

export default function NotesViewer() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("study_notes" as any)
        .select("id,title,subject,pdf_url")
        .eq("id", noteId)
        .maybeSingle();
      if (!data || cancelled) return;
      setNote(data as any);

      const pdf = await (pdfjsLib as any).getDocument({ url: (data as any).pdf_url }).promise;
      if (cancelled) return;
      setNumPages(pdf.numPages);
      pageRefs.current = new Array(pdf.numPages).fill(null);

      const containerWidth = containerRef.current?.clientWidth || 800;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const baseVp = page.getViewport({ scale: 1 });
        const cssScale = Math.min(2.5, (containerWidth - 16) / baseVp.width);
        const renderScale = cssScale * dpr;
        const viewport = page.getViewport({ scale: renderScale });
        const cssViewport = page.getViewport({ scale: cssScale });
        const canvas = pageRefs.current[i - 1];
        if (!canvas) continue;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${Math.ceil(cssViewport.width)}px`;
        canvas.style.height = `${Math.ceil(cssViewport.height)}px`;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  const onScroll = () => {
    const scroller = containerRef.current;
    if (!scroller) return;
    const mid = scroller.scrollTop + scroller.clientHeight / 2;
    for (let i = 0; i < pageRefs.current.length; i++) {
      const c = pageRefs.current[i];
      if (!c) continue;
      const wrap = c.parentElement?.parentElement;
      if (!wrap) continue;
      if (wrap.offsetTop <= mid && wrap.offsetTop + wrap.offsetHeight >= mid) {
        setCurrentPage(i + 1);
        break;
      }
    }
  };

  const handleDownload = async () => {
    if (!note?.pdf_url) return;
    try {
      const res = await fetch(note.pdf_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title || "note"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    }
  };

  // ===== Pinch-to-zoom (touch) + wheel ctrl zoom =====
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  const distance = (t1: Touch, t2: Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = {
        startDist: distance(e.touches[0], e.touches[1]),
        startZoom: zoom,
      };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = distance(e.touches[0], e.touches[1]);
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, pinchRef.current.startZoom * (dist / pinchRef.current.startDist))
      );
      setZoom(next);
    }
  };
  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.002)));
  };

  const lastTapRef = useRef<number>(0);
  const onDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoom(1);
    }
    lastTapRef.current = now;
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col select-none">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-3 py-2.5 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold truncate">{note?.title || "Loading…"}</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {note?.subject}{numPages ? ` · Page ${currentPage} / ${numPages}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-[11px] tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!note} aria-label="Download PDF">
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        onClick={onDoubleTap}
        className="flex-1 overflow-auto p-2 sm:p-4 pb-[max(env(safe-area-inset-bottom),16px)] touch-pan-y"
        style={{ touchAction: zoom > 1 ? "pan-x pan-y" : "pan-y pinch-zoom" }}
      >
        {loading && numPages === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading PDF…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }).map((_, i) => (
              <div key={i} className="relative w-full flex justify-center">
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                    transition: pinchRef.current ? "none" : "transform 0.15s ease",
                  }}
                >
                  <canvas
                    ref={(el) => (pageRefs.current[i] = el)}
                    className="rounded-md shadow-2xl bg-white pointer-events-none max-w-full h-auto"
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Rendering pages…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
