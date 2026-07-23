// The roadmap board is parsed at build time from docs/ROADMAP.md — the file
// that actually plans this repo — so the panel can no longer contradict it.
// Rebuilding the image (which every roadmap change goes through) refreshes it.
import roadmapSource from '../../../../../docs/ROADMAP.md?raw';

export type RoadmapItemStatus = 'done' | 'open';

export interface RoadmapItem {
  title: string;
  status: RoadmapItemStatus;
}

export interface RoadmapSection {
  title: string;
  items: RoadmapItem[];
  done: number;
}

const HEADING = /^## (.+)$/;
const CHECKBOX = /^- \[([ x])\] (.+)$/;
const BOLD_TITLE = /\*\*(.+?)\*\*/;

/**
 * Section headings may be partially struck through ("## ~~Now — …~~ Closed
 * out"). The struck part is history; the remainder is the current name. When
 * the whole heading is struck, the inner text is all we have.
 */
function cleanHeading(raw: string): string {
  const remainder = raw
    .replace(/~~.+?~~/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return remainder || raw.replaceAll('~~', '').replace(/\s+/g, ' ').trim();
}

/** "~~**title.**~~ Done …" / "**title.** …" -> "title" (bold span, no dot). */
function itemTitle(rest: string): string {
  const raw = BOLD_TITLE.exec(rest)?.[1] ?? rest;
  return raw.replaceAll('~~', '').replace(/\.$/, '').trim();
}

/** Sections (in file order) that contain at least one `- [ ]`/`- [x]` item. */
export function parseRoadmap(markdown: string): RoadmapSection[] {
  const sections: RoadmapSection[] = [];
  let current: RoadmapSection | null = null;

  for (const line of markdown.split('\n')) {
    const heading = HEADING.exec(line)?.[1];
    if (heading !== undefined) {
      current = { title: cleanHeading(heading), items: [], done: 0 };
      continue;
    }
    const checkbox = CHECKBOX.exec(line);
    if (!checkbox || !current) continue;
    const status: RoadmapItemStatus = checkbox[1] === 'x' ? 'done' : 'open';
    current.items.push({ title: itemTitle(checkbox[2] ?? ''), status });
    if (status === 'done') current.done += 1;
    if (current.items.length === 1) sections.push(current);
  }
  return sections;
}

export const ROADMAP_SECTIONS: readonly RoadmapSection[] = parseRoadmap(roadmapSource);
