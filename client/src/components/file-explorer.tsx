import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    FileCode,
    FileType,
    FileJson,
    Trash2,
    Plus,
    FolderOpen,
    Folder,
    FolderPlus,
    ChevronRight,
    ChevronDown,
    FilePlus,
    MoreVertical
} from "lucide-react";
import type { ProjectFile } from "@shared/schema";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from "@/components/ui/context-menu";

interface FileExplorerProps {
    files: ProjectFile[];
    activeFile: ProjectFile | null;
    onFileSelect: (file: ProjectFile) => void;
    onFileAdd: (file: ProjectFile) => void;
    onFileDelete: (fileName: string) => void;
}

type TreeNode = {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: Record<string, TreeNode>;
    file?: ProjectFile;
};

export function FileExplorer({
    files,
    activeFile,
    onFileSelect,
    onFileAdd,
    onFileDelete
}: FileExplorerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [newFileType, setNewFileType] = useState<'html' | 'css' | 'js'>("html");
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
    const [contextPath, setContextPath] = useState(""); // Path where the new file is being created

    // Build directory tree
    const fileTree = useMemo(() => {
        const root: Record<string, TreeNode> = {};

        files.forEach(file => {
            const parts = file.name.split('/');
            let currentLevel = root;
            let currentPath = '';

            parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!currentLevel[part]) {
                    const isFile = index === parts.length - 1;
                    currentLevel[part] = {
                        name: part,
                        path: currentPath,
                        type: isFile ? 'file' : 'folder',
                        children: isFile ? undefined : {},
                        file: isFile ? file : undefined
                    };
                }

                if (currentLevel[part].type === 'folder') {
                    currentLevel = currentLevel[part].children!;
                }
            });
        });

        return root;
    }, [files]);

    const openNewFileDialog = (basePath: string = "") => {
        setContextPath(basePath);
        setNewFileName(basePath ? `${basePath}/` : "");
        setIsDialogOpen(true);
    };

    const handleAddFile = () => {
        if (!newFileName) return;

        let finalName = newFileName.trim();
        // Auto-append extension if not present and it's not a hidden file (e.g. .keep)
        if (!finalName.endsWith(`.${newFileType}`) && !finalName.endsWith('.keep')) {
            finalName = `${finalName}.${newFileType}`;
        }

        // Check duplicate
        if (files.some(f => f.name === finalName)) {
            alert("File already exists!");
            return;
        }

        const newFile: ProjectFile = {
            name: finalName,
            type: newFileType,
            content: newFileType === 'html' ? '<!-- New Page -->' : '/* New Style */'
        };

        onFileAdd(newFile);
        setIsDialogOpen(false);
        setNewFileName("");
        setNewFileType("html");

        // Ensure parent folders are expanded
        const parts = finalName.split('/');
        if (parts.length > 1) {
            // Logic to expand folders could go here if needed, 
            // but simpler to just let user expand them.
        }
    };

    const toggleFolder = (path: string) => {
        const newCollapsed = new Set(collapsedFolders);
        if (newCollapsed.has(path)) {
            newCollapsed.delete(path);
        } else {
            newCollapsed.add(path);
        }
        setCollapsedFolders(newCollapsed);
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'html': return <FileCode className="w-4 h-4 text-orange-500" />;
            case 'css': return <FileType className="w-4 h-4 text-blue-500" />;
            case 'js': return <FileJson className="w-4 h-4 text-yellow-500" />;
            default: return <FileCode className="w-4 h-4" />;
        }
    };

    const renderTree = (nodes: Record<string, TreeNode>, depth = 0) => {
        const sortedKeys = Object.keys(nodes).sort((a, b) => {
            const nodeA = nodes[a];
            const nodeB = nodes[b];
            if (nodeA.type !== nodeB.type) {
                return nodeA.type === 'folder' ? -1 : 1;
            }
            return a.localeCompare(b);
        });

        return sortedKeys.map(key => {
            const node = nodes[key];
            const isCollapsed = collapsedFolders.has(node.path);
            const paddingLeft = `${depth * 12 + 8}px`;

            if (node.type === 'folder') {
                return (
                    <div key={node.path}>
                        <ContextMenu>
                            <ContextMenuTrigger>
                                <div
                                    className="flex items-center gap-1 py-1 px-2 hover:bg-muted/50 cursor-pointer text-sm select-none text-muted-foreground hover:text-foreground"
                                    style={{ paddingLeft }}
                                    onClick={() => toggleFolder(node.path)}
                                >
                                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    <Folder className="w-4 h-4 text-sky-500" />
                                    <span className="truncate flex-1">{node.name}</span>
                                </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem onClick={() => openNewFileDialog(node.path)}>
                                    <FilePlus className="w-4 h-4 mr-2" />
                                    New File...
                                </ContextMenuItem>
                                {/** Deleting a folder in flat structure is complex (requires deleting all children), 
                      skipping for now to avoid accidental data loss **/}
                            </ContextMenuContent>
                        </ContextMenu>

                        {!isCollapsed && node.children && (
                            <div>{renderTree(node.children, depth + 1)}</div>
                        )}
                    </div>
                );
            } else {
                return (
                    <ContextMenu key={node.path}>
                        <ContextMenuTrigger>
                            <div
                                className={`
                  group flex items-center justify-between py-1 px-2 text-sm cursor-pointer border-l-2 select-none
                  ${activeFile?.name === node.file?.name
                                        ? 'bg-primary/10 text-primary font-medium border-primary'
                                        : 'border-transparent hover:bg-muted/50 text-foreground'}
                `}
                                style={{ paddingLeft }}
                                onClick={() => onFileSelect(node.file!)}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {getFileIcon(node.file!.type)}
                                    <span className="truncate">{node.name}</span>
                                </div>

                                {!['html/index.html', 'css/style.css', 'js/script.js'].includes(node.path) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFileDelete(node.path);
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem
                                onClick={() => onFileDelete(node.path)}
                                disabled={['html/index.html', 'css/style.css', 'js/script.js'].includes(node.path)}
                                className="text-destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                );
            }
        });
    };

    return (
        <div className="flex flex-col h-full border-r bg-muted/10 w-64 shrink-0">
            <div className="p-3 border-b flex items-center justify-between bg-muted/20 h-10 shrink-0">
                <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    <FolderOpen className="w-3 h-3" />
                    <span>Explorer</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openNewFileDialog("")} title="New File">
                    <Plus className="w-3 h-3" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <ContextMenu>
                    <ContextMenuTrigger className="min-h-full pb-4 pt-1 w-full block">
                        {renderTree(fileTree)}
                        {/* Empty area target for root context menu */}
                        {files.length === 0 && (
                            <div className="p-4 text-xs text-muted-foreground text-center">
                                Right-click to create new files
                            </div>
                        )}
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => openNewFileDialog("")}>
                            <FilePlus className="w-4 h-4 mr-2" />
                            New File...
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            </ScrollArea>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New File</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Path / Name</label>
                            <Input
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                placeholder="e.g. pages/about"
                            />
                            <p className="text-xs text-muted-foreground">Tip: Type specific folder paths e.g. 'css/style.css'</p>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={newFileType}
                                onValueChange={(v) => setNewFileType(v as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="html">HTML</SelectItem>
                                    <SelectItem value="css">CSS</SelectItem>
                                    <SelectItem value="js">JavaScript</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddFile}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
