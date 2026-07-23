/**
 * A deliberately tiny markdown parser with first-class `[n]` citations —
 * no heavy dependency. It supports what research answers actually use:
 * paragraphs, **bold**, *italic*, `code`, and numeric `[n]` citation markers.
 *
 * Rendering to React lives in the widget that owns citation-click behaviour;
 * this module stays pure and unit-testable.
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'citation'; n: number };

export interface Block {
  type: 'paragraph';
  nodes: InlineNode[];
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[(\d+)\])/g;

function tokenizeInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex scan loop
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push({ type: 'strong', value: token.slice(2, -2) });
    } else if (token.startsWith('`')) {
      nodes.push({ type: 'code', value: token.slice(1, -1) });
    } else if (token.startsWith('*')) {
      nodes.push({ type: 'em', value: token.slice(1, -1) });
    } else {
      nodes.push({ type: 'citation', n: Number(match[2]) });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return nodes;
}

/** Parse markdown text into paragraph blocks of inline nodes. */
export function parseMarkdown(text: string): Block[] {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({
      type: 'paragraph' as const,
      nodes: tokenizeInline(chunk.replace(/\s*\n\s*/g, ' ')),
    }));
}
