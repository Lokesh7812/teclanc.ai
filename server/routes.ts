import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRequestSchema } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";
import archiver from "archiver";
import { Readable } from "stream";

// DON'T DELETE THIS COMMENT
// Using Gemini AI - the newest model series is "gemini-2.5-flash"
// do not change this unless explicitly requested by the user
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing. Check your .env file");
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_PROMPT = `You are Teclanc.ai — an expert AI Website Builder.

Your job is to generate COMPLETE, CLEAN, PRODUCTION-READY code based on the user's prompt.

CRITICAL OUTPUT FORMAT:
You MUST return ONLY a valid JSON object with this EXACT structure:

{
  "html": "<!-- full HTML code here -->",
  "css": "/* full CSS code here */",
  "js": "// full JavaScript code here"
}

STRICT RULES:
1. Output ONLY valid JSON. No markdown. No explanations. No text before or after.
2. Do NOT use code blocks or backticks.
3. HTML must be complete (<!DOCTYPE html>, <html>, <head>, <body>).
4. CSS should be comprehensive styling.
5. JavaScript should be functional and complete.
6. Use only vanilla HTML, CSS, and JavaScript.
7. No frameworks, no libraries, no CDN links.
8. Code must be responsive and modern.
9. Use clean layouts, good spacing, modern colors, and readable fonts.
10. Use semantic HTML (header, section, footer, etc.).
11. Ensure the website works immediately when files are linked together.

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
- Never ask questions. Always generate a complete website.

REMEMBER: Return ONLY the JSON object. Nothing else.`;

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

      // Generate content using the Google GenAI API
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${SYSTEM_PROMPT}\n\n${prompt}`,
      });
      
      const generatedText = result.text;
      
      if (!generatedText) {
        return res.status(500).json({ error: "Failed to generate website content" });
      }

      // Clean up the response - remove any markdown code blocks if present
      let cleanText = generatedText.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();

      // Parse JSON response
      let parsedCode: { html: string; css: string; js: string };
      try {
        parsedCode = JSON.parse(cleanText);
        if (!parsedCode.html || typeof parsedCode.html !== 'string') {
          throw new Error('Invalid JSON structure: missing html field');
        }
      } catch (parseError: any) {
        console.error("JSON Parse error:", parseError);
        console.error("Raw response:", cleanText.substring(0, 500));
        return res.status(500).json({ 
          error: "AI returned invalid format. Please try again.",
          code: "INVALID_FORMAT"
        });
      }

      // Create combined HTML for backward compatibility
      const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
${parsedCode.css || ''}
  </style>
</head>
<body>
${parsedCode.html}
  <script>
${parsedCode.js || ''}
  </script>
</body>
</html>`;

      // Save to storage
      const generation = await storage.createGeneration({
        prompt,
        generatedHtml: combinedHtml,
        generatedCss: parsedCode.css || '',
        generatedJs: parsedCode.js || '',
      });

      return res.json(generation);
    } catch (error: any) {
      console.error("Generation error:", error);
      
      // Handle specific Gemini errors
      const errorMessage = error?.message?.toLowerCase() || '';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || error?.status === 429) {
        return res.status(429).json({ 
          error: "Rate limit exceeded. Please wait a moment and try again.",
          code: "RATE_LIMIT"
        });
      }
      
      if (errorMessage.includes('api key') || error?.status === 401 || error?.status === 403) {
        return res.status(401).json({ 
          error: "Invalid API key. Please check your Gemini API key configuration.",
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

  // Download generation as ZIP
  app.get("/api/download/:id", async (req, res) => {
    try {
      const generation = await storage.getGeneration(req.params.id);
      if (!generation) {
        return res.status(404).json({ error: "Generation not found" });
      }

      // Extract HTML body content (remove DOCTYPE, html, head, body tags)
      let htmlContent = generation.generatedHtml;
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        htmlContent = bodyMatch[1].trim();
      }

      // Create index.html with proper links
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${htmlContent}
  <script src="script.js"></script>
</body>
</html>`;

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="website-${req.params.id}.zip"`);

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add files to ZIP
      archive.append(indexHtml, { name: 'index.html' });
      archive.append(generation.generatedCss || '/* No CSS generated */', { name: 'style.css' });
      archive.append(generation.generatedJs || '// No JavaScript generated', { name: 'script.js' });

      // Finalize the archive
      await archive.finalize();
    } catch (error: any) {
      console.error("Error creating ZIP:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to create ZIP file" });
      }
    }
  });

  return httpServer;
}
