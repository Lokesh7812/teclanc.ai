import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRequestSchema } from "@shared/schema";
import archiver from "archiver";
import { Readable } from "stream";

// OpenRouter API Configuration
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is missing. Check your .env file");
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Use the officially recommended free model from memory
// google/gemini-2.5-flash is confirmed to work with OpenRouter
const FREE_MODEL = 'google/gemini-2.5-flash';

// Rate limiting - track requests (adjusted for better model)
const requestTracker = {
  requests: [] as number[],
  maxRequestsPerMinute: 8, // Reasonable limit for free tier
  maxRequestsPerDay: 150,  // Daily limit for free tier
};

function canMakeRequest(): { allowed: boolean; waitTime?: number; reason?: string } {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Clean old requests
  requestTracker.requests = requestTracker.requests.filter(time => time > oneDayAgo);

  // Check per-minute limit
  const recentRequests = requestTracker.requests.filter(time => time > oneMinuteAgo);
  if (recentRequests.length >= requestTracker.maxRequestsPerMinute) {
    const oldestRecent = Math.min(...recentRequests);
    const waitTime = Math.ceil((oldestRecent + 60 * 1000 - now) / 1000);
    return { 
      allowed: false, 
      waitTime, 
      reason: `Rate limit: ${requestTracker.maxRequestsPerMinute} requests/minute. Please wait ${waitTime}s.` 
    };
  }

  // Check daily limit
  if (requestTracker.requests.length >= requestTracker.maxRequestsPerDay) {
    return { 
      allowed: false, 
      reason: `Daily quota exceeded (${requestTracker.maxRequestsPerDay} requests/day). Try again tomorrow.` 
    };
  }

  return { allowed: true };
}

function trackRequest() {
  requestTracker.requests.push(Date.now());
}

const SYSTEM_PROMPT = `You are an AI code generator. Return ONLY valid JSON. No markdown, no explanations.

FORMAT (mandatory):
{
  "files": {
    "index.html": "<complete HTML>",
    "style.css": "<complete CSS>",
    "script.js": "<complete JS>"
  }
}

RULES:
- Output ONLY this JSON. Nothing else.
- NO markdown code blocks (no \`\`\`)
- HTML: complete semantic structure
- CSS: modern, responsive styling
- JS: functional vanilla JavaScript
- Mobile-first design

Generate based on user request.`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Generate website using OpenAI
  app.post("/api/generate", async (req, res) => {
    try {
      // Check rate limits before processing
      const rateLimitCheck = canMakeRequest();
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({ 
          error: rateLimitCheck.reason,
          code: "RATE_LIMIT",
          waitTime: rateLimitCheck.waitTime
        });
      }

      const validation = generateRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Invalid request" 
        });
      }

      const { prompt } = validation.data;

      // Track this request
      trackRequest();

      // Generate content using OpenRouter API
      // Retry logic: Try once, if 429 wait 5s and retry once more
      let generatedText: string | undefined;
      let lastError: any;
      
      // Try initial request
      try {
        console.log(`Calling OpenRouter API with model: ${FREE_MODEL}`);
        
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://teclanc.ai',
            'X-Title': 'Teclanc AI Website Builder'
          },
          body: JSON.stringify({
            model: FREE_MODEL,
            max_tokens: 8192,  // Limit tokens to stay within free tier
            messages: [
              {
                role: 'system',
                content: SYSTEM_PROMPT
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: any = new Error(errorData.error?.message || `HTTP ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data = await response.json();
        generatedText = data.choices?.[0]?.message?.content;
        
        if (!generatedText) {
          throw new Error('Empty response from API');
        }
        
      } catch (apiError: any) {
        lastError = apiError;
        
        // If it's a 429 rate limit error, wait and retry ONCE
        if (apiError?.status === 429) {
          console.log('Rate limit (429) detected. Waiting 5 seconds before retry...');
          
          // Wait 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Retry once
          try {
            console.log('Retrying API call after rate limit...');
            
            const retryResponse = await fetch(OPENROUTER_API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://teclanc.ai',
                'X-Title': 'Teclanc AI Website Builder'
              },
              body: JSON.stringify({
                model: FREE_MODEL,
                max_tokens: 8192,  // Limit tokens to stay within free tier
                messages: [
                  {
                    role: 'system',
                    content: SYSTEM_PROMPT
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ]
              })
            });

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              const error: any = new Error(errorData.error?.message || `HTTP ${retryResponse.status}`);
              error.status = retryResponse.status;
              throw error;
            }

            const retryData = await retryResponse.json();
            generatedText = retryData.choices?.[0]?.message?.content;
            
            if (!generatedText) {
              throw new Error('Empty response from API');
            }
            
            console.log('Retry successful!');
            
          } catch (retryError: any) {
            // Retry failed, use this error
            lastError = retryError;
            console.error('Retry failed:', retryError.message);
          }
        }
        
        // If we still don't have generated text, throw the last error
        if (!generatedText) {
          throw lastError;
        }
      }
      
      if (!generatedText) {
        return res.status(500).json({ 
          error: "AI returned empty response. Please retry.",
          code: "EMPTY_RESPONSE"
        });
      }

      // STEP 1: Clean up the response - remove markdown code blocks if present
      let cleanText = generatedText.trim();
      
      // Remove ```json and ``` markers
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7);
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();
      
      // CRITICAL: Try to fix common JSON issues before parsing
      // Sometimes AI returns JSON with unescaped newlines in string values
      // This attempts to parse and stringify to normalize the JSON
      try {
        // If the JSON has literal newlines inside strings, they need to be escaped
        // Attempt a lenient parse by escaping common control characters
        const jsonWithEscapedControlChars = cleanText
          .replace(/(?<!\\)\n/g, '\\n')  // Escape unescaped newlines
          .replace(/(?<!\\)\r/g, '\\r')  // Escape unescaped carriage returns
          .replace(/(?<!\\)\t/g, '\\t'); // Escape unescaped tabs
        
        // Try parsing the cleaned version
        JSON.parse(jsonWithEscapedControlChars);
        cleanText = jsonWithEscapedControlChars;
      } catch (e) {
        // If that fails, continue with original cleanText
        console.log('[JSON CLEANUP] Could not pre-process JSON, using as-is');
      }

      // STEP 2: Parse JSON response with strict validation and fallback support
      let parsedResponse: { files: { "index.html": string; "style.css": string; "script.js": string } };
      try {
        // First, try parsing as-is
        const rawParsed = JSON.parse(cleanText);
        
        // Check if it's the new format {files: {...}}
        if (rawParsed.files && typeof rawParsed.files === 'object') {
          parsedResponse = rawParsed;
          
          // Validate required fields
          if (!parsedResponse.files["index.html"] || typeof parsedResponse.files["index.html"] !== 'string') {
            throw new Error('Missing or invalid "index.html" in files');
          }
          
          // Optional fields - set defaults if missing
          if (!parsedResponse.files["style.css"]) {
            parsedResponse.files["style.css"] = '';
          }
          if (!parsedResponse.files["script.js"]) {
            parsedResponse.files["script.js"] = '';
          }
          
        // Fallback: Check if it's the old format {html, css, js}
        } else if (rawParsed.html || rawParsed.css || rawParsed.js) {
          console.log('[BACKWARD COMPAT] Converting old format to new format');
          parsedResponse = {
            files: {
              "index.html": rawParsed.html || '',
              "style.css": rawParsed.css || '',
              "script.js": rawParsed.js || ''
            }
          };
        } else {
          throw new Error('Response does not match any expected format');
        }
        
      } catch (parseError: any) {
        console.error("[JSON PARSE ERROR]", parseError.message);
        console.error("[RAW RESPONSE]", cleanText.substring(0, 500));
        
        return res.status(500).json({ 
          error: "AI response format error. Please retry.",
          code: "INVALID_FORMAT"
        });
      }

      // STEP 3: Extract files and create backward-compatible structure
      const htmlContent = parsedResponse.files["index.html"];
      const cssContent = parsedResponse.files["style.css"] || '';
      const jsContent = parsedResponse.files["script.js"] || '';
      
      // Extract HTML body content for storage (remove DOCTYPE, html, head, body tags if present)
      let bodyContent = htmlContent;
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1].trim();
      }

      // STEP 4: Create combined HTML for preview (backward compatibility)
      const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
${cssContent}
  </style>
</head>
<body>
${bodyContent}
  <script>
${jsContent}
  </script>
</body>
</html>`;

      // STEP 5: Save to storage
      const generation = await storage.createGeneration({
        prompt,
        generatedHtml: combinedHtml,
        generatedCss: cssContent,
        generatedJs: jsContent,
      });

      return res.json(generation);
    } catch (error: any) {
      console.error("Generation error:", error);
      
      // Handle specific API errors
      const errorMessage = error?.message?.toLowerCase() || '';
      
      // 429 Rate Limit - User-friendly message
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || error?.status === 429) {
        return res.status(429).json({ 
          error: "Too many requests. Please wait 30-60 seconds and try again.",
          code: "RATE_LIMIT"
        });
      }
      
      if (errorMessage.includes('api key') || error?.status === 401 || error?.status === 403) {
        return res.status(401).json({ 
          error: "Invalid API key. Please check your OpenRouter API key configuration.",
          code: "INVALID_API_KEY"
        });
      }
      
      if (errorMessage.includes('empty response') || error?.code === 'EMPTY_RESPONSE') {
        return res.status(500).json({ 
          error: "AI returned an empty response. Please try again.",
          code: "EMPTY_RESPONSE"
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
