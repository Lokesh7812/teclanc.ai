export type FileType = 'html' | 'css' | 'js';

export function formatCode(code: string, type: FileType): string {
    if (!code) return "";

    try {
        switch (type) {
            case 'html':
                return formatHtml(code);
            case 'css':
                return formatCss(code);
            case 'js':
                return formatJs(code);
            default:
                return code;
        }
    } catch (e) {
        console.error("Formatting failed:", e);
        return code;
    }
}

function formatHtml(html: string): string {
    let formatted = '';
    let indent = 0;

    // Remove existing whitespace between tags to start fresh
    const cleanHtml = html.replace(/>\s+</g, '><').trim();

    // Split by tags
    // This regex matches tags, comments, or text content
    const parts = cleanHtml.split(/(<[^>]+>)/g).filter(Boolean);

    const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

    parts.forEach(part => {
        if (part.startsWith('</')) {
            // Closing tag
            indent = Math.max(0, indent - 1);
            formatted += '  '.repeat(indent) + part + '\n';
        } else if (part.startsWith('<') && !part.startsWith('<!')) {
            // Opening tag (or void tag)
            formatted += '  '.repeat(indent) + part + '\n';

            const tagName = part.match(/<([a-z0-9]+)/i)?.[1]?.toLowerCase();
            if (tagName && !voidTags.includes(tagName) && !part.endsWith('/>')) {
                indent++;
            }
        } else {
            // Text content
            if (part.trim()) {
                formatted += '  '.repeat(indent) + part.trim() + '\n';
            }
        }
    });

    return formatted.trim();
}

function formatCss(css: string): string {
    let formatted = '';
    let indent = 0;

    // Remove newlines and excess spaces
    const cleanCss = css.replace(/\s+/g, ' ').replace(/\{\s+/g, '{').replace(/\s+\}/g, '}').replace(/;\s+/g, ';');

    for (let i = 0; i < cleanCss.length; i++) {
        const char = cleanCss[i];

        if (char === '{') {
            formatted += ' {\n';
            indent++;
            formatted += '  '.repeat(indent);
        } else if (char === '}') {
            formatted += '\n';
            indent = Math.max(0, indent - 1);
            formatted += '  '.repeat(indent) + '}';
            if (i + 1 < cleanCss.length && cleanCss[i + 1] !== '}') {
                formatted += '\n' + '  '.repeat(indent);
            }
        } else if (char === ';') {
            formatted += ';\n' + '  '.repeat(indent);
        } else {
            formatted += char;
        }
    }

    return formatted.trim();
}

function formatJs(js: string): string {
    let formatted = '';
    let indent = 0;
    let inString = false;

    // A very basic JS formatter
    // Ideally, use a library, but this helps for simple minified code

    // Remove simple newlines if creating congestion, but be careful not to break code
    // We'll process char by char

    const cleanJs = js.trim();

    for (let i = 0; i < cleanJs.length; i++) {
        const char = cleanJs[i];

        // Toggle string mode (simplified, doesn't handle escaped quotes perfectly)
        if (char === '"' || char === "'") inString = !inString;

        if (inString) {
            formatted += char;
            continue;
        }

        if (char === '{') {
            formatted += ' {\n';
            indent++;
            formatted += '  '.repeat(indent);
        } else if (char === '}') {
            formatted += '\n';
            indent = Math.max(0, indent - 1);
            formatted += '  '.repeat(indent) + '}';
        } else if (char === ';') {
            formatted += ';\n' + '  '.repeat(indent);
        } else {
            formatted += char;
        }
    }

    return formatted.trim();
}
