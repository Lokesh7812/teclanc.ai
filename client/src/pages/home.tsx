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
import { FileExplorer } from "@/components/file-explorer";
import { MobileNav } from "@/components/mobile-nav";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Generation, ProjectFile } from "@shared/schema";
import { formatCode } from "@/lib/formatter";
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
  FileCode,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen
} from "lucide-react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type DeviceMode = 'mobile' | 'tablet' | 'desktop';
type MobileView = 'prompt' | 'code' | 'preview';

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);

  // Multi-file state
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  const [progress, setProgress] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // Mobile specific state
  const [mobileView, setMobileView] = useState<MobileView>('prompt');

  const [showHistory, setShowHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeMobileFile, setActiveMobileFile] = useState<boolean>(false); // To close sheet on select

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
        const errorCode = errorData.code;
        const waitTime = errorData.waitTime;
        const error: any = new Error(errorMessage);
        error.code = errorCode;
        error.waitTime = waitTime;
        throw error;
      }
      return response.json();
    },
    onSuccess: (data: Generation) => {
      setCurrentHtml(data.generatedHtml);
      setCurrentGeneration(data);

      // Parse files or create from legacy fields
      let projectFiles: ProjectFile[] = [];
      try {
        if (data.files) {
          projectFiles = JSON.parse(data.files);
        }
      } catch (e) {
        // Fallback if parsing fails
      }

      // If no files (legacy support), create from individual fields
      if (projectFiles.length === 0) {
        // Extract body content for editability if needed, but for files we prefer full content
        // For legacy, we reconstruct
        const bodyMatch = data.generatedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1].trim() : data.generatedHtml;

        projectFiles = [
          { name: 'index.html', type: 'html', content: bodyContent },
          { name: 'style.css', type: 'css', content: data.generatedCss || '' },
          { name: 'script.js', type: 'js', content: data.generatedJs || '' }
        ];
      }

      setFiles(projectFiles.map(f => ({
        ...f,
        content: formatCode(f.content, f.type)
      })));
      setActiveFile(prev => {
        const found = projectFiles.find(f => f.name === 'html/index.html' || f.name === 'index.html');
        return found ? { ...found, content: formatCode(found.content, found.type) } : projectFiles[0];
      });

      // On mobile, switch to preview automatically on success
      if (window.innerWidth < 768) {
        setMobileView('preview');
      }

      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      toast({
        title: "Website generated!",
        description: "Your website is ready. Code has been formatted for readability.",
      });
    },
    onError: (error: any) => {
      let title = "Generation failed";
      let description = error.message || "Something went wrong. Please try again.";

      // Special handling for API key errors
      if (error.code === 'INVALID_API_KEY') {
        title = "🔑 API Key Required";
        description = "Please set up your Gemini API key. Check SETUP.md for instructions. Get your free key at: aistudio.google.com/app/apikey";
      } else if (error.code === 'RATE_LIMIT') {
        title = "⏱️ Rate Limit Reached";
        if (error.waitTime) {
          description = `Gemini free tier limit reached. Please wait ${error.waitTime} seconds before trying again.`;
        } else {
          description = error.message || "Please wait a moment before trying again. The free tier has usage limits.";
        }
      }

      toast({
        title,
        description,
        variant: "destructive",
        duration: error.waitTime ? (error.waitTime * 1000 + 2000) : 5000,
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

  const handleManualStart = useCallback(() => {
    const templateHtml = `<!-- Welcome to the Manual Code Editor! -->
<div class="container">
  <h1>Hello, World!</h1>
  <p>Start editing this code to see changes instantly.</p>
</div>`;

    const templateCss = `body {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  padding: 2rem;
  background: #f9fafb;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

h1 {
  color: #111827;
  margin-top: 0;
}`;

    const templateJs = `// Add your JavaScript here
console.log('Hello from manual editor!');`;

    const manualFiles: ProjectFile[] = [
      { name: 'html/index.html', type: 'html', content: templateHtml },
      { name: 'css/style.css', type: 'css', content: templateCss },
      { name: 'js/script.js', type: 'js', content: templateJs }
    ];

    setPrompt("Manual Coding Session");
    setFiles(manualFiles.map(f => ({
      ...f,
      content: formatCode(f.content, f.type)
    })));
    setActiveFile(manualFiles[0]); // Don't format here, content already formatted above
    setCurrentHtml(templateHtml);

    // Auto switch to code view on mobile
    if (window.innerWidth < 768) {
      setMobileView('code');
    }

    // Set dummy generation object to enable view switching
    setCurrentGeneration({
      id: "manual-" + Date.now(),
      prompt: "Manual Coding Session",
      generatedHtml: templateHtml,
      generatedCss: templateCss,
      generatedJs: templateJs,
      files: JSON.stringify(manualFiles),
      createdAt: new Date()
    } as Generation);
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

  const handleLoadGeneration = useCallback((generation: Generation) => {
    setPrompt(generation.prompt);
    setCurrentHtml(generation.generatedHtml);
    setCurrentGeneration(generation);

    // Parse files or create from legacy fields
    let projectFiles: ProjectFile[] = [];
    try {
      if (generation.files) {
        projectFiles = JSON.parse(generation.files);
      }
    } catch (e) {
      // Fallback
    }

    if (projectFiles.length === 0) {
      const bodyMatch = generation.generatedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const content = bodyMatch ? bodyMatch[1].trim() : generation.generatedHtml;

      projectFiles = [
        { name: 'index.html', type: 'html', content },
        { name: 'style.css', type: 'css', content: generation.generatedCss || '' },
        { name: 'script.js', type: 'js', content: generation.generatedJs || '' }
      ];
    }

    setFiles(projectFiles.map(f => ({
      ...f,
      content: formatCode(f.content, f.type)
    })));
    setActiveFile(prev => {
      const found = projectFiles.find(f => f.name === 'html/index.html' || f.name === 'index.html');
      return found ? { ...found, content: formatCode(found.content, found.type) } : projectFiles[0];
    });

    // On load, maybe stay on prompt or go to preview? Let's go to preview
    if (window.innerWidth < 768) {
      setMobileView('preview');
    }
  }, []);

  const handleNewGeneration = useCallback(() => {
    setPrompt("");
    setCurrentHtml(null);
    setCurrentGeneration(null);
    setFiles([]);
    setActiveFile(null);
    setMobileView('prompt');
  }, []);

  // File Operations
  const handleFileUpdate = (newContent: string) => {
    if (!activeFile) return;

    setFiles(prev => prev.map(f =>
      f.name === activeFile.name ? { ...f, content: newContent } : f
    ));
    setActiveFile(prev => prev ? { ...prev, content: newContent } : null);
  };

  const handleFileAdd = (newFile: ProjectFile) => {
    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile);
  };

  const handleFileDelete = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    if (activeFile?.name === fileName) {
      setActiveFile(files.find(f => f.name !== fileName) || null);
    }
  };

  const handleFileSelect = (file: ProjectFile) => {
    setActiveFile(file);
    setActiveMobileFile(false); // Close sheet if open (mobile)
  }

  // Advanced Live Preview: Bundle all resources
  const livePreview = useMemo(() => {
    if (files.length === 0) return null;

    // Find the current HTML file to render
    // Prioritize html/index.html for the default view, or index.html, or any HTML file
    let htmlFile = activeFile?.type === 'html' ? activeFile : files.find(f => f.name === 'html/index.html' || f.name === 'index.html');

    if (!htmlFile) {
      // Fallback: Use the first HTML file found
      htmlFile = files.find(f => f.type === 'html');
    }

    if (!htmlFile) return null;

    // Collect all CSS content
    const cssContent = files
      .filter(f => f.type === 'css')
      .map(f => f.content)
      .join('\n');

    // Collect all JS content
    const jsContent = files
      .filter(f => f.type === 'js')
      .map(f => f.content)
      .join('\n');

    // Inject navigation script
    const navScript = `
      <script>
        document.addEventListener('click', (e) => {
          const link = e.target.closest('a');
          if (link && link.getAttribute('href')) {
            e.preventDefault();
            const href = link.getAttribute('href');
            // Send navigation request to parent
            window.parent.postMessage({ type: 'NAVIGATE', href }, '*');
          }
        });
      </script>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview - ${htmlFile.name}</title>
  <style>
${cssContent}
  </style>
</head>
<body>
${htmlFile.content}
${navScript}
  <script>
${jsContent}
  </script>
</body>
</html>`;
  }, [files, activeFile]);

  // Handle preview navigation messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'NAVIGATE' && e.data?.href) {
        const href = e.data.href;

        // Find file matching the href (simple resolution)
        // Adjust this logic for folder support if needed (relative paths)
        let targetName = href;

        // Remove leading ./ or /
        targetName = targetName.replace(/^(\.\/|\/)/, '');

        const targetFile = files.find(f => f.name === targetName);

        if (targetFile) {
          setActiveFile(targetFile);
          toast({
            title: "Navigating",
            description: `Switched to ${targetName}`,
          });
          // Also switch to code or preview view? 
          // If user clicked in preview, they are in preview. 
          // If we want to show the file code, switch to code view?
          // Actually, standard behavior is staying in preview unless they verify the code.
        } else {
          toast({
            title: "Link blocked",
            description: `File '${targetName}' not found in project.`,
            variant: "destructive"
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files, toast]);

  const truncatePrompt = (text: string, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Device preview dimensions
  const getPreviewWidth = () => {
    switch (deviceMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': default: return '100%';
    }
  };

  const DeviceIcon = ({ mode }: { mode: DeviceMode }) => {
    switch (mode) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'desktop': default: return <Monitor className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    setShowHistory(false);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* HEADER */}
      <header className="flex items-center justify-between gap-4 px-4 md:px-6 h-14 md:h-16 border-b shrink-0 z-40 bg-background">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary">
            <Code2 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <span className="text-lg md:text-xl font-semibold">Teclanc.AI</span>
        </div>

        {/* Desktop Header Controls */}
        <div className="hidden md:flex items-center gap-2">
          {currentHtml && (
            <>
              <div className="hidden lg:flex items-center gap-1 mr-2">
                {(['mobile', 'tablet', 'desktop'] as DeviceMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={deviceMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceMode(mode)}
                    className="gap-2"
                  >
                    <DeviceIcon mode={mode} />
                    <span className="hidden xl:inline capitalize">{mode}</span>
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadZip} className="hidden lg:flex">
                <FileArchive className="w-4 h-4 md:mr-2" />
                <span className="hidden xl:inline">ZIP</span>
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/about">
              <User className="w-4 h-4" />
              <span className="hidden lg:inline">About</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleNewGeneration} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">New</span>
          </Button>
          <ThemeToggle />
        </div>

        {/* Mobile Header Controls */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {/* If in code/preview mode, show relevant top actions? */}
          {currentHtml && mobileView === 'code' && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Files</SheetTitle>
                </SheetHeader>
                <FileExplorer
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={handleFileSelect} // Closes sheet on select
                  onFileAdd={handleFileAdd}
                  onFileDelete={handleFileDelete}
                />
              </SheetContent>
            </Sheet>
          )}
          {currentHtml && mobileView === 'preview' && (
            <Button variant="outline" size="sm" onClick={handleDownloadZip}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          {/* ... existing mobile menu ... */}
          <div className="absolute right-0 top-0 h-full w-64 bg-background border-l shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 h-14 border-b">
                <span className="font-semibold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start h-12 text-base" asChild onClick={() => setShowMobileMenu(false)}>
                  <Link href="/about"><User className="w-5 h-5 mr-3" /> About</Link>
                </Button>
                <div className="border-t my-2"></div>
                <div className="px-3 py-2 flex justify-between items-center">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE PROMPT & VIEW SWITCHING */}
      {/* 
         LAYOUT STRATEGY:
         - Desktop: Side-by-side (History, Code/Preview).
         - Mobile: One view active at a time determined by 'mobileView'.
      */}

      <main className="flex flex-1 overflow-hidden relative pb-16 md:pb-0">

        {/* DESKTOP SIDEBAR / MOBILE PROMPT VIEW */}
        {(!currentHtml || (window.innerWidth >= 768) || mobileView === 'prompt') && (
          <div className={`${(currentHtml && mobileView !== 'prompt') ? 'hidden md:flex' : 'flex'
            } flex-col w-full md:w-80 lg:w-96 border-r bg-muted/20 absolute md:static inset-0 z-10 bg-background md:bg-transparent`}>

            {/* Input Area */}
            <div className="flex flex-col flex-1 p-4 gap-4 md:border-b bg-background relative">
              {/* 
                 On mobile, we want this to be scrollable if history is long, 
                 but the input needs to be accessible. 
                 If we have history, show history list, and put input at bottom fixed?
                 
                 Let's keep it simple: History list takes space, Input fixed at bottom on mobile.
               */}

              {/* Mobile History List (If exists) */}
              {generations.length > 0 && (
                <div className="flex-1 overflow-y-auto mb-32 md:mb-0">
                  <div className="text-sm font-medium text-muted-foreground mb-2 px-1">History</div>
                  {generations.map((g) => (
                    <Card key={g.id} className="p-3 mb-2 cursor-pointer hover:shadow-md bg-card/50" onClick={() => handleLoadGeneration(g)}>
                      <div className="flex justify-between gap-2">
                        <div className="truncate text-sm font-medium">{truncatePrompt(g.prompt)}</div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(g.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{format(new Date(g.createdAt), "MMM d, h:mm a")}</div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Prompt Input - Fixed bottom on mobile, normal on desktop */}
              <div className={`
                 flex flex-col gap-2 
                 ${window.innerWidth < 768 ? 'fixed bottom-16 left-0 right-0 p-4 bg-background border-t shadow-lg z-20' : ''}
               `}>
                <label className="text-sm font-medium text-muted-foreground hidden md:block">Describe your website</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Create a modern portfolio website..."
                  className="min-h-[80px] md:min-h-32 font-mono text-sm resize-none"
                />
                {!currentHtml && (
                  <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
                    {["Portfolio", "Blog", "Landing"].map(ex => (
                      <Button key={ex} variant="outline" size="sm" className="whitespace-nowrap" onClick={() => setPrompt(`Create a ${ex}...`)}>
                        {ex}
                      </Button>
                    ))}
                  </div>
                )}
                <Button size="lg" className="w-full" onClick={handleGenerate} disabled={generateMutation.isPending || prompt.trim().length < 10}>
                  {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Website</>}
                </Button>

                {/* Manual Start Button for Mobile Prompt View */}
                {!currentHtml && (
                  <Button variant="secondary" className="w-full mt-2" onClick={handleManualStart}>
                    <Code2 className="w-4 h-4 mr-2" /> Start Coding Manually
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop History List */}
            <div className="hidden md:flex flex-1 overflow-hidden flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">History</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="flex flex-col p-3 gap-2">
                  {generations.map((g) => (
                    <Card key={g.id} className="p-3 cursor-pointer hover:shadow-md" onClick={() => handleLoadGeneration(g)}>
                      <div className="flex justify-between gap-2">
                        <div className="truncate text-sm font-medium">{truncatePrompt(g.prompt)}</div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(g.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{format(new Date(g.createdAt), "MMM d, h:mm a")}</div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* WORKSPACE AREA */}
        <div className={`flex flex-col flex-1 overflow-hidden relative ${mobileView === 'prompt' && window.innerWidth < 768 && currentHtml ? 'hidden' : ''}`}>
          {generateMutation.isPending && (
            <div className="absolute top-0 left-0 right-0 z-50"><Progress value={progress} className="h-1 rounded-none" /></div>
          )}

          {generateMutation.isPending ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-lg font-medium">Generating your website...</p>
            </div>
          ) : currentHtml ? (
            <div className="flex flex-col lg:flex-row h-full">

              {/* FILE EXPLORER & EDITOR */}
              {/* On Mobile: Show this only if mobileView === 'code' */}
              <div className={`
                 flex flex-1 border-r overflow-hidden
                 ${window.innerWidth < 768 ? (mobileView === 'code' ? 'flex' : 'hidden') : 'flex'}
              `}>
                {/* Desktop Explorer */}
                <div className="hidden md:block h-full shrink-0">
                  {isExplorerOpen && (
                    <FileExplorer
                      files={files}
                      activeFile={activeFile}
                      onFileSelect={setActiveFile}
                      onFileAdd={handleFileAdd}
                      onFileDelete={handleFileDelete}
                    />
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="hidden md:flex items-center gap-2 px-2 py-1 border-b bg-muted/20 h-10 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setIsExplorerOpen(!isExplorerOpen)} className="h-8 w-8">
                      {isExplorerOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm font-medium truncate">{activeFile?.name || 'No file selected'}</span>
                  </div>
                  <div className="flex-1 relative">
                    <CodeEditor
                      activeFile={activeFile}
                      onContentChange={handleFileUpdate}
                    />
                  </div>
                </div>
              </div>

              {/* PREVIEW PANEL */}
              {/* On Mobile: Show this only if mobileView === 'preview' */}
              <div className={`
                 flex flex-col w-full lg:w-1/2 bg-muted/5 border-l
                 ${window.innerWidth < 768 ? (mobileView === 'preview' ? 'flex h-full' : 'hidden') : 'flex'}
              `}>
                <div className="hidden md:flex items-center justify-between px-4 py-2 border-b bg-background h-10 shrink-0">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Preview</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                    const blob = new Blob([livePreview || ''], { type: "text/html" });
                    window.open(URL.createObjectURL(blob), "_blank");
                  }}>
                    <ExternalLink className="w-3 h-3 mr-1" /> Open
                  </Button>
                </div>
                <div className="flex-1 bg-muted/10 md:p-4 flex items-center justify-center overflow-auto">
                  <div className="bg-white shadow-2xl transition-all duration-300 origin-top" style={{ width: getPreviewWidth(), height: '100%' }}>
                    <iframe
                      srcDoc={livePreview || ''}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                      title="Preview"
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            // LANDING STATE - Desktop Only (Mobile handles prompt view separately in sidebar area)
            <div className={`
                flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center
                ${window.innerWidth < 768 ? 'hidden' : 'flex'}
             `}>
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Code2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">AI Website Builder</h2>
              <p className="text-muted-foreground max-w-md">Describe your dream website or start coding manually.</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["Portfolio", "Business Page", "Blog"].map(ex => (
                  <Button key={ex} variant="outline" size="sm" onClick={() => setPrompt(`Create a ${ex.toLowerCase()}...`)}>
                    {ex}
                  </Button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t w-full max-w-md">
                <Button variant="secondary" onClick={handleManualStart}>
                  <Code2 className="w-4 h-4 mr-2" /> Start Coding Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE NAVIGATION BAR */}
      <MobileNav
        currentView={mobileView}
        onViewChange={setMobileView}
        disabled={!currentHtml && !generateMutation.isPending && mobileView === 'prompt'}
      />
    </div>
  );
}
