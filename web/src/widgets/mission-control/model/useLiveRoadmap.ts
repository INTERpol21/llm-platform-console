import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '../../../shared/config/index.ts';
import { parseRoadmap, ROADMAP_SECTIONS, type RoadmapSection } from './roadmap.ts';

const REFRESH_MS = 60_000;

async function fetchRoadmapMarkdown(): Promise<string> {
  const response = await fetch(`${API_BASE}/roadmap`, {
    headers: { Accept: 'text/markdown, text/plain' },
  });
  if (!response.ok) throw new Error(`roadmap fetch failed: ${response.status}`);
  return response.text();
}

/**
 * The live plan: ROADMAP.md from the repo's main branch via the BFF,
 * re-checked every minute so "what we are doing right now" ([~] items,
 * fresh strikethroughs) shows up without an image rebuild. While loading —
 * or whenever the live source is unreachable (offline umbrella) — the copy
 * baked in at build time keeps the panel correct as-of-build.
 */
export function useLiveRoadmap(): { sections: readonly RoadmapSection[]; live: boolean } {
  const query = useQuery({
    queryKey: ['roadmap', 'live'],
    queryFn: fetchRoadmapMarkdown,
    select: parseRoadmap,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS / 2,
    retry: 1,
  });
  // An empty parse (unexpected upstream content) is as useless as an error.
  if (query.data && query.data.length > 0) {
    return { sections: query.data, live: true };
  }
  return { sections: ROADMAP_SECTIONS, live: false };
}
