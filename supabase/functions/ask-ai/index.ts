import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPrompt, conversationHistory, questionText, options, correctAnswer, solution } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build system prompt with question context
    const systemPrompt = `You are PARTH, an expert JEE tutor AI assistant for Prepixo. Your role is to help students understand physics, chemistry, and mathematics concepts.

CURRENT QUESTION CONTEXT:
Question: ${questionText || "Not provided"}
Options: ${options ? JSON.stringify(options) : "Not provided"}
Correct Answer: ${correctAnswer || "Not provided"}
Solution: ${solution || "Not provided"}

INSTRUCTIONS:
1. Be patient, encouraging, and supportive
2. Explain concepts step-by-step using simple language
3. Use LaTeX notation for mathematical expressions (wrap in $ for inline, $$ for block)
4. If the student asks about the current question, refer to the context above
5. Provide hints rather than direct answers when appropriate
6. Break down complex problems into smaller steps
7. Use analogies and real-world examples when helpful
8. Keep responses concise but thorough`;

    // Build conversation for Gemini
    const contents = [];
    
    // Add system instruction as first user turn
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt + "\n\nPlease acknowledge and begin helping." }]
    });
    contents.push({
      role: "model", 
      parts: [{ text: "I understand. I'm PARTH, your JEE tutor AI. I'm ready to help you with this question. What would you like to know?" }]
    });

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ask-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
