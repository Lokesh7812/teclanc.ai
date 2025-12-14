import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRequestSchema } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are Teclanc.ai — an expert AI Website Builder.

Your job is to generate COMPLETE, CLEAN, PRODUCTION-READY HTML, CSS, and JavaScript code based on the user's prompt.

STRICT RULES:
1. Output ONLY code. No explanations. No comments outside code.
2. Do NOT use Markdown.
3. Do NOT use backticks.
4. Do NOT include any text before or after the code.
5. Always return a SINGLE HTML file.
6. Embed all CSS inside a <style> tag.
7. Embed all JavaScript inside a <script> tag.
8. Use only vanilla HTML, CSS, and JavaScript.
9. No frameworks, no libraries, no CDN links.
10. Code must be responsive and modern.
11. Use clean layouts, good spacing, modern colors, and readable fonts.
12. Use semantic HTML (header, section, footer, etc.).
13. Ensure the website works immediately when opened in a browser.

WEBSITE GENERATION LOGIC:
- If the user asks for a portfolio → generate a full portfolio website.
- If the user asks for a business site → generate a business landing page.
- If the user asks for a form → include form validation using JavaScript.
- If the user asks for animations → use CSS animations only.
- If the user asks for interactivity → use JavaScript.

DEFAULT SECTIONS (when applicable):
- Header with navigation
- Hero section
- Content sections based on prompt
- Contact section
- Footer

DESIGN STYLE:
- Modern
- Minimal
- Professional
- Mobile-first
- Smooth hover effects

ERROR HANDLING:
- If the prompt is unclear, make reasonable assumptions and proceed.
- Never ask questions. Always generate a complete website.`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Generate website using OpenAI
  app.post("/api/generate", async (req, res) => {
    try {
      const validation = generateRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Invalid request" 
        });
      }

      const { prompt } = validation.data;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 8192,
      });

      const generatedHtml = response.choices[0]?.message?.content;
      
      if (!generatedHtml) {
        return res.status(500).json({ error: "Failed to generate website content" });
      }

      // Clean up the response - remove any markdown code blocks if present
      let cleanHtml = generatedHtml.trim();
      if (cleanHtml.startsWith("```html")) {
        cleanHtml = cleanHtml.slice(7);
      } else if (cleanHtml.startsWith("```")) {
        cleanHtml = cleanHtml.slice(3);
      }
      if (cleanHtml.endsWith("```")) {
        cleanHtml = cleanHtml.slice(0, -3);
      }
      cleanHtml = cleanHtml.trim();

      // Save to storage
      const generation = await storage.createGeneration({
        prompt,
        generatedHtml: cleanHtml,
      });

      return res.json(generation);
    } catch (error: any) {
      console.error("Generation error:", error);
      
      // Handle specific OpenAI errors
      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        return res.status(429).json({ 
          error: "Rate limit exceeded. Please wait a moment and try again.",
          code: "RATE_LIMIT"
        });
      }
      
      if (error?.code === 'insufficient_quota') {
        return res.status(402).json({ 
          error: "OpenAI API quota exceeded. Please check your billing details.",
          code: "QUOTA_EXCEEDED"
        });
      }

      if (error?.status === 401 || error?.code === 'invalid_api_key') {
        return res.status(401).json({ 
          error: "Invalid API key. Please check your OpenAI API key configuration.",
          code: "INVALID_API_KEY"
        });
      }

      return res.status(500).json({ 
        error: "Failed to generate website. Please try again.",
        code: "GENERATION_FAILED"
      });
    }
  });

  // Get all generations
  app.get("/api/generations", async (req, res) => {
    try {
      const generations = await storage.getGenerations();
      return res.json(generations);
    } catch (error: any) {
      console.error("Error fetching generations:", error);
      return res.status(500).json({ error: "Failed to fetch generations" });
    }
  });

  // Get single generation
  app.get("/api/generations/:id", async (req, res) => {
    try {
      const generation = await storage.getGeneration(req.params.id);
      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }
      return res.json(generation);
    } catch (error: any) {
      console.error("Error fetching generation:", error);
      return res.status(500).json({ error: "Failed to fetch generation" });
    }
  });

  // Delete generation
  app.delete("/api/generations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGeneration(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Generation not found" });
      }
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting generation:", error);
      return res.status(500).json({ error: "Failed to delete generation" });
    }
  });

  return httpServer;
}
