import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "@/components/code-editor";
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
  Clock,
  FileArchive,
  Monitor,
  Tablet,
  Smartphone,
  Menu,
  X,
  Eye,
  FileCode
} from "lucide-react";
import { format } from "date-fns";

type DeviceMode = 'mobile' | 'tablet' | 'desktop';
type MobileView = 'prompt' | 'preview' | 'code';

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const [editableHtml, setEditableHtml] = useState("");
  const [editableCss, setEditableCss] = useState("");
  const [editableJs, setEditableJs] = useState("");
  const [progress, setProgress] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [mobileView, setMobileView] = useState<MobileView>('prompt');
  const [showHistory, setShowHistory] = useState(false);
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
      setCurrentGeneration(data);
      
      // Extract HTML body content
      const bodyMatch = data.generatedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const htmlContent = bodyMatch ? bodyMatch[1].trim() : data.generatedHtml;
      
      setEditableHtml(htmlContent);
      setEditableCss(data.generatedCss || '');
      setEditableJs(data.generatedJs || '');
      
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      toast({
        title: "Website generated!",
        description: "Your website is ready. You can preview, edit, and download it.",
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
    setCurrentGeneration(generation);
    
    // Extract HTML body content
    const bodyMatch = generation.generatedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const htmlContent = bodyMatch ? bodyMatch[1].trim() : generation.generatedHtml;
    
    setEditableHtml(htmlContent);
    setEditableCss(generation.generatedCss || '');
    setEditableJs(generation.generatedJs || '');
  }, []);

  const handleNewGeneration = useCallback(() => {
    setPrompt("");
    setCurrentHtml(null);
    setCurrentGeneration(null);
    setEditableHtml("");
    setEditableCss("");
    setEditableJs("");
  }, []);

  const handleDownloadZip = useCallback(() => {
    if (!currentGeneration) return;
    
    // Create a link to trigger download
    const link = document.createElement('a');
    link.href = `/api/download/${currentGeneration.id}`;
    link.download = `website-${currentGeneration.id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloading...",
      description: "Your website is being downloaded as a ZIP file.",
    });
  }, [currentGeneration, toast]);

  // Live preview based on editable code
  const livePreview = useMemo(() => {
    if (!editableHtml && !currentHtml) return null;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>
${editableCss}
  </style>
</head>
<body>
${editableHtml}
  <script>
${editableJs}
  </script>
</body>
</html>`;
  }, [editableHtml, editableCss, editableJs, currentHtml]);

  const truncatePrompt = (text: string, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Device preview dimensions
  const getPreviewWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
      default:
        return '100%';
    }
  };

  const DeviceIcon = ({ mode }: { mode: DeviceMode }) => {
    switch (mode) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Desktop/Tablet Header */}
      <header className="hidden md:flex items-center justify-between gap-4 px-4 md:px-6 h-14 md:h-16 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary">
            <Code2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <span className="text-lg md:text-xl font-semibold">Teclanc.AI</span>
        </div>
        <div className="flex items-center gap-2">
          {currentHtml && (
            <>
              {/* Device Mode Selector */}
              <div className="hidden lg:flex items-center gap-1 mr-2">
                {(['mobile', 'tablet', 'desktop'] as DeviceMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={deviceMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceMode(mode)}
                    className="gap-2"
                    data-testid={`button-device-${mode}`}
                  >
                    <DeviceIcon mode={mode} />
                    <span className="hidden xl:inline capitalize">{mode}</span>
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadZip}
                data-testid="button-download-zip-header"
              >
                <FileArchive className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">ZIP</span>
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewGeneration}
            data-testid="button-new-generation"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">New</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between gap-4 px-4 h-14 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Code2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Teclanc.AI</span>
        </div>
        <div className="flex items-center gap-2">
          {currentHtml && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadZip}
              data-testid="button-download-zip-mobile"
            >
              <FileArchive className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* History Sidebar - Desktop/Tablet */}
        <div className="hidden md:flex flex-col w-full md:w-80 lg:w-96 border-r bg-muted/20">
          <div className="flex flex-col p-4 md:p-6 gap-4 border-b bg-background">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Describe your website
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Create a modern portfolio website with sections for about, projects, skills, and contact..."
                className="min-h-32 md:min-h-40 font-mono text-xs md:text-sm resize-none"
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
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b bg-background">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">History</span>
              <span className="text-xs text-muted-foreground">
                ({generations.length})
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex flex-col p-3 md:p-4 gap-2">
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
                      className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleLoadGeneration(generation)}
                      data-testid={`card-generation-${generation.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {truncatePrompt(generation.prompt, 50)}
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
                          className="h-8 w-8"
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

        {/* Main Content Area - Desktop/Tablet */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden">
          {generateMutation.isPending && (
            <div className="absolute top-0 left-0 right-0 z-10">
              <Progress value={progress} className="h-1 rounded-none" />
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
            <div className="flex flex-col lg:flex-row h-full">
              {/* Code Editor Panel */}
              <div className="flex flex-col w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Source Code</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="hidden lg:flex"
                    data-testid="button-download-html"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    HTML
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    html={editableHtml}
                    css={editableCss}
                    js={editableJs}
                    onHtmlChange={setEditableHtml}
                    onCssChange={setEditableCss}
                    onJsChange={setEditableJs}
                  />
                </div>
              </div>

              {/* Preview Panel */}
              <div className="relative flex flex-col w-full lg:w-1/2">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Live Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Mobile device selector for tablet */}
                    <div className="flex lg:hidden items-center gap-1">
                      {(['mobile', 'tablet', 'desktop'] as DeviceMode[]).map((mode) => (
                        <Button
                          key={mode}
                          variant={deviceMode === mode ? 'default' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeviceMode(mode)}
                          data-testid={`button-device-${mode}-tablet`}
                        >
                          <DeviceIcon mode={mode} />
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (livePreview) {
                          const blob = new Blob([livePreview], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          window.open(url, "_blank");
                        }
                      }}
                      data-testid="button-open-new-tab"
                    >
                      <ExternalLink className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Open</span>
                    </Button>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-muted/10 p-4">
                  <div 
                    className="bg-white shadow-2xl transition-all duration-300 ease-in-out"
                    style={{ 
                      width: getPreviewWidth(),
                      height: '100%',
                      maxWidth: '100%'
                    }}
                  >
                    <iframe
                      srcDoc={livePreview || ''}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                      title="Website Preview"
                      data-testid="iframe-preview"
                    />
                  </div>
                </div>
              </div>
            </div>
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
                  Describe your dream website and let AI
                  generate complete, production-ready code.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "Portfolio",
                  "Business Landing Page",
                  "Blog",
                  "Restaurant Website",
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

        {/* Mobile View with Bottom Navigation */}
        <div className="md:hidden flex flex-col flex-1 overflow-hidden">
          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            {mobileView === 'prompt' && (
              <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Describe your website
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Create a modern portfolio website..."
                    className="min-h-48 font-mono text-sm resize-none"
                    data-testid="input-prompt-mobile"
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || prompt.trim().length < 10}
                  data-testid="button-generate-mobile"
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
                {!currentHtml && (
                  <div className="flex flex-col gap-2 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Quick Start:</p>
                    {[
                      "Portfolio",
                      "Business Page",
                      "Blog",
                    ].map((example) => (
                      <Button
                        key={example}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrompt(`Create a ${example.toLowerCase()} website with a modern, professional design.`);
                        }}
                        className="w-full justify-start"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileView === 'preview' && (
              <div className="flex flex-col h-full">
                {generateMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4 p-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Generating...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        10-30 seconds
                      </p>
                    </div>
                  </div>
                ) : currentHtml ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                      <span className="text-sm font-medium">Preview</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (livePreview) {
                            const blob = new Blob([livePreview], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            window.open(url, "_blank");
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <iframe
                      srcDoc={livePreview || ''}
                      className="flex-1 w-full border-0 bg-white"
                      sandbox="allow-scripts"
                      title="Website Preview"
                      data-testid="iframe-preview-mobile"
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
                    <Code2 className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold mb-2">No Preview Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate a website to see the preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mobileView === 'code' && (
              <div className="flex flex-col h-full">
                {currentHtml ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                      <span className="text-sm font-medium">Source Code</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        data-testid="button-download-html-mobile"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <CodeEditor
                        html={editableHtml}
                        css={editableCss}
                        js={editableJs}
                        onHtmlChange={setEditableHtml}
                        onCssChange={setEditableCss}
                        onJsChange={setEditableJs}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
                    <FileCode className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold mb-2">No Code Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate a website to see the code
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="border-t bg-background">
            <div className="flex items-center justify-around h-16">
              <Button
                variant={mobileView === 'prompt' ? 'default' : 'ghost'}
                className="flex-1 h-full rounded-none flex-col gap-1"
                onClick={() => setMobileView('prompt')}
                data-testid="button-mobile-prompt"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">Prompt</span>
              </Button>
              <Button
                variant={mobileView === 'preview' ? 'default' : 'ghost'}
                className="flex-1 h-full rounded-none flex-col gap-1"
                onClick={() => setMobileView('preview')}
                data-testid="button-mobile-preview"
              >
                <Eye className="w-5 h-5" />
                <span className="text-xs">Preview</span>
              </Button>
              <Button
                variant={mobileView === 'code' ? 'default' : 'ghost'}
                className="flex-1 h-full rounded-none flex-col gap-1"
                onClick={() => setMobileView('code')}
                data-testid="button-mobile-code"
              >
                <FileCode className="w-5 h-5" />
                <span className="text-xs">Code</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile History Overlay */}
        {showHistory && (
          <div className="md:hidden absolute inset-0 bg-background z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">History</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(false)}
              >
                <X className="w-5 h-5" />
              </Button>
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
                  </div>
                ) : (
                  generations.map((generation) => (
                    <Card
                      key={generation.id}
                      className="p-4 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => {
                        handleLoadGeneration(generation);
                        setShowHistory(false);
                        setMobileView('preview');
                      }}
                      data-testid={`card-generation-mobile-${generation.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {generation.prompt}
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
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(generation.id);
                          }}
                          data-testid={`button-delete-mobile-${generation.id}`}
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
        )}
      </main>
    </div>
  );
}
