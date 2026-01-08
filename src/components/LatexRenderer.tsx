import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  content: string;
  className?: string;
}

export const LatexRenderer = ({ content, className = "" }: LatexRendererProps) => {
  if (!content) return null;

  // Process the content - handle different LaTeX delimiters
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