import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeEditorProps {
  html: string;
  css: string;
  js: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
  onJsChange: (value: string) => void;
}

export function CodeEditor({ 
  html, 
  css, 
  js, 
  onHtmlChange, 
  onCssChange, 
  onJsChange 
}: CodeEditorProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (code: string, tabName: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedTab(tabName);
      toast({
        title: "Copied!",
        description: `${tabName} code copied to clipboard.`,
      });
      setTimeout(() => setCopiedTab(null), 2000);
    });
  };

  return (
    <Card className="flex flex-col h-full">
      <Tabs defaultValue="html" className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="html" className="flex-1 m-0 p-4 overflow-hidden">
          <div className="flex flex-col h-full gap-2">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(html, "HTML")}
                data-testid="button-copy-html"
              >
                {copiedTab === "HTML" ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={html}
              onChange={(e) => onHtmlChange(e.target.value)}
              className="flex-1 font-mono text-sm resize-none"
              placeholder="HTML code will appear here..."
              data-testid="textarea-html"
            />
          </div>
        </TabsContent>

        <TabsContent value="css" className="flex-1 m-0 p-4 overflow-hidden">
          <div className="flex flex-col h-full gap-2">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(css, "CSS")}
                data-testid="button-copy-css"
              >
                {copiedTab === "CSS" ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={css}
              onChange={(e) => onCssChange(e.target.value)}
              className="flex-1 font-mono text-sm resize-none"
              placeholder="CSS code will appear here..."
              data-testid="textarea-css"
            />
          </div>
        </TabsContent>

        <TabsContent value="js" className="flex-1 m-0 p-4 overflow-hidden">
          <div className="flex flex-col h-full gap-2">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(js, "JavaScript")}
                data-testid="button-copy-js"
              >
                {copiedTab === "JavaScript" ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={js}
              onChange={(e) => onJsChange(e.target.value)}
              className="flex-1 font-mono text-sm resize-none"
              placeholder="JavaScript code will appear here..."
              data-testid="textarea-js"
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
