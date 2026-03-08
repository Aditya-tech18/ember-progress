import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { LatexRenderer } from "@/components/LatexRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuestionContext {
  id: number;
  question_text: string;
  options_list: string | null;
  correct_answer: string | null;
  solution: string | null;
}

const AIChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const questionContext = location.state as QuestionContext | null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm **PARTH**, your AI tutor. I'm here to help you understand this question. What's your doubt? 🤔",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseOptions = (optionsList: string | null): string[] => {
    if (!optionsList) return [];
    try {
      const parsed = JSON.parse(optionsList);
      return Object.entries(parsed).map(([key, value]) => `(${key}) ${value}`);
    } catch {
      return [];
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText("");
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error: fnError } = await supabase.functions.invoke("ask-ai", {
        body: {
          userPrompt: text,
          conversationHistory,
          questionText: questionContext?.question_text || "",
          options: parseOptions(questionContext?.options_list || null),
          correctAnswer: questionContext?.correct_answer || "",
          solution: questionContext?.solution || "",
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      console.error("AI Chat error:", e);
      setError(e.message || "Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3"
        >
          <div className="container mx-auto max-w-3xl flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-crimson flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground flex items-center gap-2">
                  PARTH
                  <Sparkles className="w-4 h-4 text-gold" />
                </h1>
                <p className="text-xs text-muted-foreground">Your AI Tutor</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
          <div className="container mx-auto max-w-3xl space-y-4">
            {/* Question Context Card */}
            {questionContext && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 mb-6 border-l-4 border-primary"
              >
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  Current Question
                </p>
                <div className="text-sm text-foreground line-clamp-3 overflow-hidden">
                  <LatexRenderer content={questionContext.question_text} />
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-gold to-amber-500"
                        : "bg-gradient-to-br from-primary to-crimson"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-card border border-border rounded-tl-md"
                    }`}
                  >
                    <div className="text-sm leading-relaxed overflow-x-auto">
                      <LatexRenderer content={msg.content} />
                    </div>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-crimson flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PARTH is thinking...
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-background/95 backdrop-blur-lg p-4"
        >
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your doubt..."
                disabled={isLoading}
                className="flex-1 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl"
              />
              <Button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-crimson hover:opacity-90"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              PARTH can help explain concepts, solve problems, and clarify doubts.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIChat;
