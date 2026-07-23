import { describe, expect, it } from 'vitest';
import { parseRoadmap, ROADMAP_SECTIONS } from '../widgets/mission-control/model/roadmap.ts';

const FIXTURE = `# Roadmap

Prose intro, no checkboxes.

## Status snapshot (delivered)

Only prose here — this section must not appear.

## ~~Now — unblock~~ Closed out (kept for history)

- [x] ~~**Ship the thing.**~~ Done 2026-07-20 — details
      wrapped onto the next line.
- [x] ~~**Tag releases.**~~ Done.

## Next — new capabilities (priority 2)

- [ ] **Folder connector (local-first).** Watch a folder. **Size:** M.
- [x] ~~**Trivy image scan in CI.**~~ Done 2026-07-23.
`;

describe('parseRoadmap', () => {
  const sections = parseRoadmap(FIXTURE);

  it('keeps only sections that contain checkbox items, in file order', () => {
    expect(sections.map((s) => s.title)).toEqual([
      'Closed out (kept for history)',
      'Next — new capabilities (priority 2)',
    ]);
  });

  it('uses the unstruck remainder of a partially struck heading', () => {
    expect(sections[0]?.title).toBe('Closed out (kept for history)');
  });

  it('extracts the bold title without strikethrough or the trailing dot', () => {
    expect(sections[0]?.items[0]).toEqual({ title: 'Ship the thing', status: 'done' });
    // The first bold span is the title even when the line has more bold text.
    expect(sections[1]?.items[0]).toEqual({
      title: 'Folder connector (local-first)',
      status: 'open',
    });
  });

  it('counts done items per section', () => {
    expect(sections[0]?.done).toBe(2);
    expect(sections[1]?.done).toBe(1);
    expect(sections[1]?.items ?? []).toHaveLength(2);
  });
});

describe('the committed docs/ROADMAP.md', () => {
  it('parses into non-empty sections so the panel can never render blank', () => {
    expect(ROADMAP_SECTIONS.length).toBeGreaterThanOrEqual(3);
    for (const section of ROADMAP_SECTIONS) {
      expect(section.title).not.toBe('');
      expect(section.title).not.toContain('~~');
      expect(section.items.length).toBeGreaterThan(0);
      for (const item of section.items) {
        expect(item.title).not.toBe('');
        expect(item.title).not.toContain('**');
      }
    }
  });

  it('reflects real progress: both done and open work exist', () => {
    const items = ROADMAP_SECTIONS.flatMap((s) => s.items);
    expect(items.some((i) => i.status === 'done')).toBe(true);
    expect(items.some((i) => i.status === 'open')).toBe(true);
  });
});

describe('in-progress marker', () => {
  it('parses `- [~]` as active and counts it as not done', () => {
    const sections = parseRoadmap(
      '## Now\n\n- [~] **Doing this.** right now\n- [x] ~~**Shipped.**~~ Done\n- [ ] **Queued.** later\n',
    );
    expect(sections[0]?.items.map((i) => i.status)).toEqual(['active', 'done', 'open']);
    expect(sections[0]?.done).toBe(1);
  });
});
