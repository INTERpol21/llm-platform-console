import { Fragment, useMemo } from 'react';
import { parseMarkdown } from '../../../shared/lib/index.ts';
import type { InlineNode } from '../../../shared/lib/index.ts';
import styles from './AnswerView.module.css';

export interface AnswerViewProps {
  text: string;
  citationCount: number;
  onCite: (n: number) => void;
}

function renderNode(
  node: InlineNode,
  key: number,
  citationCount: number,
  onCite: (n: number) => void,
) {
  switch (node.type) {
    case 'text':
      return <Fragment key={key}>{node.value}</Fragment>;
    case 'strong':
      return <strong key={key}>{node.value}</strong>;
    case 'em':
      return <em key={key}>{node.value}</em>;
    case 'code':
      return (
        <code key={key} className={styles.code}>
          {node.value}
        </code>
      );
    case 'citation': {
      const valid = node.n >= 1 && node.n <= citationCount;
      return (
        <button
          key={key}
          type="button"
          className={styles.citation}
          data-testid="citation"
          data-citation={node.n}
          disabled={!valid}
          onClick={() => onCite(node.n)}
        >
          [{node.n}]
        </button>
      );
    }
    default:
      return null;
  }
}

/** Renders the research answer as light markdown with clickable [n] citations. */
export function AnswerView({ text, citationCount, onCite }: AnswerViewProps) {
  // During streaming `text` grows one token at a time; parsing it on every render
  // is O(n²) over the answer length. Memoize so we only re-parse when it changes.
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return (
    <div className={styles.answer} data-testid="answer">
      {blocks.map((block, blockIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are positional
        <p key={blockIndex} className={styles.paragraph}>
          {block.nodes.map((node, nodeIndex) => renderNode(node, nodeIndex, citationCount, onCite))}
        </p>
      ))}
    </div>
  );
}
