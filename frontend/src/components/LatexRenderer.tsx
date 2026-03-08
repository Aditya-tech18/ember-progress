import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  content: string;
  className?: string;
  preserveParagraphs?: boolean;
}

export const LatexRenderer = ({ content, className = "", preserveParagraphs = false }: LatexRendererProps) => {
  if (!content) return null;

  // If preserveParagraphs is true, split by double newlines and render as paragraphs
  if (preserveParagraphs) {
    // Split content by double newlines (paragraph breaks) or single newlines
    const paragraphs = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return (
      <div className={`latex-content space-y-4 ${className}`}>
        {paragraphs.map((paragraph, index) => {
          // Handle single newlines within a paragraph as line breaks
          const lines = paragraph.split(/\n/).map((line, lineIndex) => (
            <span key={lineIndex}>
              <Latex>{line.replace(/\\\\/g, "\\")}</Latex>
              {lineIndex < paragraph.split(/\n/).length - 1 && <br />}
            </span>
          ));

          return (
            <p key={index} className="text-muted-foreground leading-relaxed">
              {lines}
            </p>
          );
        })}
      </div>
    );
  }

  // Default behavior - inline rendering
  const processedContent = content
    .replace(/\\\\/g, "\\") // Fix double backslashes
    .replace(/\n/g, " "); // Handle newlines

  return (
    <div className={`latex-content ${className}`}>
      <Latex>{processedContent}</Latex>
    </div>
  );
};

export default LatexRenderer;