import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import { Lightbulb, Brain, Calculator, Sparkles } from "lucide-react";

interface LatexRendererProps {
  content: string;
  className?: string;
  preserveParagraphs?: boolean;
  multilineSolution?: boolean;
}

export const LatexRenderer = ({ 
  content, 
  className = "", 
  preserveParagraphs = false,
  multilineSolution = false 
}: LatexRendererProps) => {
  if (!content) return null;

  // Clean up common rendering issues
  const cleanContent = (text: string) => {
    return text
      .replace(/\\n/g, '\n') // Convert literal \n to actual newlines
      .replace(/\\\\/g, '\\') // Fix double backslashes
      .replace(/\n\n\n+/g, '\n\n') // Remove excessive newlines
      .trim();
  };

  // Multiline solution format with sections
  if (multilineSolution) {
    const cleaned = cleanContent(content);
    const sections = parseSolutionSections(cleaned);

    return (
      <div className={`space-y-4 ${className}`}>
        {sections.keyConcept && (
          <div className="glass-card p-4 rounded-xl border border-pink-500/20 bg-pink-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Brain className="w-5 h-5 text-pink-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-pink-400 mb-2">🧠 Key Concept:</h4>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <Latex>{sections.keyConcept}</Latex>
                </div>
              </div>
            </div>
          </div>
        )}

        {sections.trickUsed && (
          <div className="glass-card p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-yellow-400 mb-2">💡 Trick Used:</h4>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <Latex>{sections.trickUsed}</Latex>
                </div>
              </div>
            </div>
          </div>
        )}

        {sections.formulaUsed && (
          <div className="glass-card p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calculator className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-400 mb-2">📐 Formula Used:</h4>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  {sections.formulaUsed.split('\n').map((formula, idx) => (
                    <div key={idx}>
                      <Latex>{formula}</Latex>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {sections.explanation && (
          <div className="glass-card p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-purple-400 mb-2">✨ Explanation:</h4>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                  {sections.explanation.split('\n\n').map((para, idx) => (
                    <p key={idx}>
                      <Latex>{para}</Latex>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {sections.answer && (
          <div className="glass-card p-4 rounded-xl border border-green-500/30 bg-green-500/10">
            <div className="text-center">
              <span className="text-sm font-semibold text-green-400">✅ Answer: </span>
              <span className="text-base font-bold text-green-300">
                <Latex>{sections.answer}</Latex>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If preserveParagraphs is true, split by double newlines and render as paragraphs
  if (preserveParagraphs) {
    const cleaned = cleanContent(content);
    const paragraphs = cleaned
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return (
      <div className={`latex-content space-y-3 ${className}`}>
        {paragraphs.map((paragraph, index) => {
          const lines = paragraph.split(/\n/).map((line, lineIndex) => (
            <span key={lineIndex}>
              <Latex>{line}</Latex>
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

  // Default behavior - inline rendering with newline preservation
  const cleaned = cleanContent(content);
  const lines = cleaned.split(/\n/);

  return (
    <div className={`latex-content ${className}`}>
      {lines.map((line, idx) => (
        <span key={idx}>
          <Latex>{line}</Latex>
          {idx < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
};

// Helper function to parse solution into sections
function parseSolutionSections(content: string) {
  const sections: {
    keyConcept?: string;
    trickUsed?: string;
    formulaUsed?: string;
    explanation?: string;
    answer?: string;
  } = {};

  // Extract Key Concept
  const keyConceptMatch = content.match(/(?:Key Concept|🧠):\s*([\s\S]*?)(?=(?:Trick Used|💡|Formula Used|📐|Explanation|✨|Answer|✅|$))/i);
  if (keyConceptMatch) {
    sections.keyConcept = keyConceptMatch[1].trim();
  }

  // Extract Trick Used
  const trickMatch = content.match(/(?:Trick Used|💡):\s*([\s\S]*?)(?=(?:Formula Used|📐|Explanation|✨|Answer|✅|$))/i);
  if (trickMatch) {
    sections.trickUsed = trickMatch[1].trim();
  }

  // Extract Formula Used
  const formulaMatch = content.match(/(?:Formula Used|📐):\s*([\s\S]*?)(?=(?:Explanation|✨|Answer|✅|$))/i);
  if (formulaMatch) {
    sections.formulaUsed = formulaMatch[1].trim();
  }

  // Extract Explanation
  const explanationMatch = content.match(/(?:Explanation|✨):\s*([\s\S]*?)(?=(?:Answer|✅|$))/i);
  if (explanationMatch) {
    sections.explanation = explanationMatch[1].trim();
  }

  // Extract Answer
  const answerMatch = content.match(/(?:Answer|Ans\.?|✅):\s*(.+?)(?:\n|$)/i);
  if (answerMatch) {
    sections.answer = answerMatch[1].trim();
  }

  // If no sections found, treat entire content as explanation
  if (!sections.keyConcept && !sections.trickUsed && !sections.formulaUsed && !sections.explanation) {
    sections.explanation = content;
  }

  return sections;
}

export default LatexRenderer;