import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Generation } from "@shared/schema";
import { 
  Sparkles, 
  Download, 
  History, 
  Trash2, 
  Plus, 
  Code2, 
  Loader2,
  ExternalLink,
  Clock
} from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { data: generations = [], isLoading: historyLoading } = useQuery<Generation[]>({
    queryKey: ["/api/generations"],
  });

  const generateMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const response = await apiRequest("POST", "/api/generate", { prompt: promptText });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to generate website";
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (data: Generation) => {
      setCurrentHtml(data.generatedHtml);
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      toast({
        title: "Website generated!",
        description: "Your website is ready. You can preview and download it.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/generations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      toast({
        title: "Deleted",
        description: "Generation removed from history.",
      });
    },
  });

  useEffect(() => {
    if (generateMutation.isPending) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [generateMutation.isPending]);

  const handleGenerate = useCallback(() => {
    if (prompt.trim().length < 10) {
      toast({
        title: "Prompt too short",
        description: "Please describe your website in at least 10 characters.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(prompt);
  }, [prompt, generateMutation, toast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleDownload = useCallback(() => {
    if (!currentHtml) return;
    const blob = new Blob([currentHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Your website has been downloaded as website.html",
    });
  }, [currentHtml, toast]);

  const handleLoadGeneration = useCallback((generation: Generation) => {
    setPrompt(generation.prompt);
    setCurrentHtml(generation.generatedHtml);
  }, []);

  const handleNewGeneration = useCallback(() => {
    setPrompt("");
    setCurrentHtml(null);
  }, []);

  const truncatePrompt = (text: string, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between gap-4 px-6 h-16 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Teclanc.AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleNewGeneration}
            data-testid="button-new-generation"
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full">
          <div className="flex flex-col w-full lg:w-[40%] border-r">
            <div className="flex flex-col p-6 gap-4 border-b">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Describe your website
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Create a personal portfolio for a frontend developer named Alex with a modern, minimalist design. Include sections for about, projects, skills, and contact..."
                  className="min-h-64 font-mono text-sm resize-none"
                  data-testid="input-prompt"
                />
                <span className="text-xs text-muted-foreground">
                  Press Ctrl/Cmd + Enter to generate
                </span>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={generateMutation.isPending || prompt.trim().length < 10}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Website
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">History</span>
                <span className="text-xs text-muted-foreground">
                  ({generations.length})
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="flex flex-col p-4 gap-2">
                  {historyLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))
                  ) : generations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <History className="w-10 h-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No generations yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your generated websites will appear here
                      </p>
                    </div>
                  ) : (
                    generations.map((generation) => (
                      <Card
                        key={generation.id}
                        className="p-4 cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => handleLoadGeneration(generation)}
                        data-testid={`card-generation-${generation.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {truncatePrompt(generation.prompt)}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(generation.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(generation.id);
                            }}
                            data-testid={`button-delete-${generation.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="relative flex flex-col flex-1 min-h-[60vh] lg:min-h-0">
            {generateMutation.isPending && (
              <div className="absolute top-0 left-0 right-0 z-10">
                <Progress value={progress} className="h-1 rounded-none" />
              </div>
            )}

            {currentHtml && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    const blob = new Blob([currentHtml], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                  }}
                  data-testid="button-open-new-tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}

            {generateMutation.isPending ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">Generating your website...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This usually takes 10-30 seconds
                  </p>
                </div>
              </div>
            ) : currentHtml ? (
              <iframe
                srcDoc={currentHtml}
                className="flex-1 w-full h-full border-0 bg-white"
                sandbox="allow-scripts"
                title="Website Preview"
                data-testid="iframe-preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Code2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-xl font-semibold mb-2">
                    AI Website Builder
                  </h2>
                  <p className="text-muted-foreground">
                    Describe your dream website in the prompt area and let AI
                    generate complete, production-ready HTML, CSS, and JavaScript
                    for you.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    "Portfolio",
                    "Business Landing Page",
                    "Blog",
                    "Restaurant Website",
                    "Product Page",
                  ].map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(`Create a ${example.toLowerCase()} website with a modern, professional design.`)}
                      data-testid={`button-example-${example.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
