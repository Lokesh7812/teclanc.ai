import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Copy, Check, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProjectFile } from "@shared/schema";

interface CodeEditorProps {
  activeFile: ProjectFile | null;
  onContentChange: (newContent: string) => void;
}

export function CodeEditor({
  activeFile,
  onContentChange
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!activeFile) {
    return (
      <Card className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <FileCode className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a file to start editing</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full rounded-none border-0">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10 h-10 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">
          {activeFile.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 p-0 overflow-hidden relative">
        <Textarea
          value={activeFile.content}
          onChange={(e) => onContentChange(e.target.value)}
          className="absolute inset-0 w-full h-full resize-none font-mono text-sm leading-relaxed border-0 rounded-none focus-visible:ring-0 p-4"
          placeholder="Start coding..."
          spellCheck={false}
        />
      </div>
    </Card>
  );
}
