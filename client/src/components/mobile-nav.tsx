import { Button } from "@/components/ui/button";
import { Sparkles, Code2, Eye } from "lucide-react";

type MobileView = 'prompt' | 'code' | 'preview';

interface MobileNavProps {
    currentView: MobileView;
    onViewChange: (view: MobileView) => void;
    // Disable code/preview if no generation exists
    disabled?: boolean;
}

export function MobileNav({ currentView, onViewChange, disabled }: MobileNavProps) {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 flex items-center justify-around px-2 pb-safe">
            <Button
                variant="ghost"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-lg ${currentView === 'prompt' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                onClick={() => onViewChange('prompt')}
            >
                <Sparkles className="w-5 h-5" />
                <span className="text-[10px] font-medium">Chat</span>
            </Button>

            <Button
                variant="ghost"
                disabled={disabled}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-lg ${currentView === 'code' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                onClick={() => onViewChange('code')}
            >
                <Code2 className="w-5 h-5" />
                <span className="text-[10px] font-medium">Code</span>
            </Button>

            <Button
                variant="ghost"
                disabled={disabled}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-lg ${currentView === 'preview' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                onClick={() => onViewChange('preview')}
            >
                <Eye className="w-5 h-5" />
                <span className="text-[10px] font-medium">Preview</span>
            </Button>
        </div>
    );
}
