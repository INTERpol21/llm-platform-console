#!/usr/bin/env python3
"""Cross-service smoke test for the whole AI platform.

Runs against an *already-running* stack and verifies the real links between
services — not each service in isolation:

    console BFF   --/api/*-->  gateway | rag | orchestrator
    rag-pgvector  --chat--->   llm-gateway      (synthesis through the gateway)
    orchestrator  --/v1/query->  rag-pgvector
    orchestrator  --MCP----->  mcp-tools-server

Two modes:

    # umbrella stack (docker compose up -d --build --wait), via Caddy + BFF
    python scripts/platform_smoke.py

    # backends started by hand on their own ports (make run in each repo)
    python scripts/platform_smoke.py --direct

    # same, when something else already owns 8080-8083
    SMOKE_GATEWAY_PORT=18080 SMOKE_RAG_PORT=18081 SMOKE_ORCH_PORT=18083 \
        python scripts/platform_smoke.py --direct

Only httpx is required; the MCP leg is checked through the orchestrator, so no
MCP client library is needed.
"""

from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Iterator
from contextlib import contextmanager

import httpx

HEADERS = {"Authorization": "Bearer demo-key"}


class Endpoints:
    """Where each service lives, per mode.

    In the umbrella stack the backends are not published on the host: Caddy owns
    :8080 and proxies /api/* to the BFF, which fans out to the services. In
    --direct mode each backend is hit on its own port.
    """

    def __init__(self, direct: bool) -> None:
        if direct:
            # Ports are overridable: another local dev server may already own
            # 8080-8083 (compose then publishes on IPv6 only and 127.0.0.1
            # silently reaches the other process instead).
            host = os.environ.get("SMOKE_HOST", "127.0.0.1")
            self.gateway = f"http://{host}:{os.environ.get('SMOKE_GATEWAY_PORT', '8080')}"
            self.rag = f"http://{host}:{os.environ.get('SMOKE_RAG_PORT', '8081')}"
            self.orch = f"http://{host}:{os.environ.get('SMOKE_ORCH_PORT', '8083')}"
            self.health = f"{self.gateway}/healthz"
        else:
            base = "http://127.0.0.1:8080/api"
            self.gateway = f"{base}/gateway"
            self.rag = f"{base}/rag"
            self.orch = f"{base}/orchestrator"
            self.health = "http://127.0.0.1:8080/api/health"
        self.direct = direct


CHECKS: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    CHECKS.append((name, ok, detail))
    print(f"{'OK  ' if ok else 'FAIL'} {name}" + (f" - {detail}" if detail else ""))


@contextmanager
def stage(name: str) -> Iterator[None]:
    """Turn a dead service into a readable FAIL instead of a traceback.

    A refused connection mid-run means the link under test is broken — that is a
    result the report should carry, not a crash that hides the checks that had
    already passed.
    """
    try:
        yield
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        check(name, False, f"{type(exc).__name__}: {str(exc)[:120]}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--direct",
        action="store_true",
        help="hit backends on their own ports instead of going through Caddy+BFF",
    )
    args = parser.parse_args()
    ep = Endpoints(args.direct)

    print(f"mode: {'direct ports' if args.direct else 'umbrella stack (Caddy + BFF)'}\n")

    try:
        httpx.get(ep.health, timeout=5.0)
    except httpx.HTTPError as exc:
        print(f"stack not reachable at {ep.health}: {exc}")
        print("start it with: docker compose up -d --build --wait")
        return 2

    with httpx.Client(timeout=30.0, follow_redirects=True) as c:
        with stage("gateway: unreachable"):
            # --- gateway on its own -------------------------------------------------
            r = c.post(
                f"{ep.gateway}/v1/chat/completions",
                headers=HEADERS,
                json={"model": "mock-small", "messages": [{"role": "user", "content": "ping"}]},
            )
            ok = r.status_code == 200 and bool(r.json()["choices"][0]["message"]["content"])
            check(
                "gateway: mock-small completion",
                ok,
                f"provider={r.headers.get('x-provider')} cost={r.headers.get('x-cost-usd')}",
            )

            r2 = c.post(
                f"{ep.gateway}/v1/chat/completions",
                headers=HEADERS,
                json={"model": "mock-small", "messages": [{"role": "user", "content": "ping"}]},
            )
            check(
                "gateway: cache hit on repeat",
                r2.headers.get("x-cache") == "hit",
                f"x-cache={r2.headers.get('x-cache')}",
            )

            r = c.get(f"{ep.gateway}/v1/models/catalog", headers=HEADERS)
            models = r.json()
            check(
                "gateway: model catalog served",
                r.status_code == 200 and bool(models),
                f"{r.status_code}",
            )

            usage_before = c.get(f"{ep.gateway}/v1/usage", headers=HEADERS).text

        with stage("rag: unreachable"):
            # --- rag: ingest, then a cited answer synthesized through the gateway ----
            docs = [
                {
                    "id": "pgvector-indexing",
                    "title": "pgvector indexing",
                    "text": (
                        "pgvector stores embeddings in a vector column. For similarity "
                        "search it supports IVFFlat and HNSW indexes. HNSW builds a "
                        "navigable small-world graph and gives better recall at high "
                        "throughput, while IVFFlat partitions vectors into lists and is "
                        "cheaper to build. Distance operators cover cosine, L2 and inner "
                        "product."
                    ),
                }
            ]
            r = c.post(f"{ep.rag}/v1/ingest", headers=HEADERS, json={"documents": docs})
            body = r.json() if r.status_code == 200 else {}
            indexed = body.get("chunks_indexed", 0)
            skipped = body.get("skipped", 0)
            # Ingest is idempotent by content hash: on a repeat run the document is
            # skipped rather than re-chunked, so either outcome means "the corpus is
            # in the store" — only a document that is neither indexed nor skipped is
            # a failure.
            check(
                "rag: corpus ingested",
                r.status_code == 200 and (indexed > 0 or skipped > 0),
                f"chunks={indexed} skipped={skipped}",
            )

            r = c.post(
                f"{ep.rag}/v1/query",
                headers=HEADERS,
                json={
                    "question": "How does pgvector index vectors for similarity search?",
                    "top_k": 4,
                },
            )
            q = r.json() if r.status_code == 200 else {}
            top = q["citations"][0]["document_id"] if q.get("citations") else "none"
            check(
                "rag: cited answer",
                r.status_code == 200 and bool(q.get("answer")) and bool(q.get("citations")),
                f"top citation={top}",
            )

            # Whether synthesis crosses the network depends on the rag deployment:
            # with LLM_BACKEND=mock (the compose default) rag answers in-process and
            # must NOT touch the gateway; with LLM_BACKEND=openai + LLM_BASE_URL
            # pointing at the gateway it must. Read /v1/stats and assert the link
            # that this deployment actually claims.
            usage_after = c.get(f"{ep.gateway}/v1/usage", headers=HEADERS).text
            stats = c.get(f"{ep.rag}/v1/stats", headers=HEADERS).json()
            llm_backend = str(stats.get("llm", stats.get("llm_backend", "")))
            grew = usage_after != usage_before
            if "mock" in llm_backend.lower():
                check(
                    "rag: synthesis stays in-process (LLM_BACKEND=mock)",
                    not grew,
                    f"llm={llm_backend}, gateway usage unchanged as expected",
                )
            else:
                check(
                    "rag -> gateway: synthesis went through the gateway",
                    grew,
                    f"llm={llm_backend}, gateway /v1/usage grew after the rag query",
                )

        with stage("orchestrator: unreachable"):
            # --- orchestrator end-to-end (fans out to gateway, rag and MCP) ---------
            r = c.post(
                f"{ep.orch}/v1/research",
                headers=HEADERS,
                json={
                    "question": "How does the llm gateway handle provider failures?",
                    "max_iterations": 2,
                },
                timeout=120.0,
            )
            res = r.json() if r.status_code == 200 else {}
            trace = " | ".join(res.get("trace", []))
            stages = all(s in trace for s in ("plan", "execute", "reflect", "synthesize"))
            sources = sorted({e["source"] for e in res.get("evidence", [])})
            check(
                "orchestrator: /v1/research end-to-end",
                r.status_code == 200 and bool(res.get("answer")) and stages,
                f"iterations={res.get('iterations')} "
                f"evidence={len(res.get('evidence', []))} sources={sources}",
            )
            check(
                "orchestrator -> rag: evidence collected from the live rag service",
                "rag" in sources,
                str(sources),
            )
            check("orchestrator: answer cites [n]", "[1]" in res.get("answer", ""), "")

            # SSE trace must stream (Caddy sets flush_interval -1 for this path).
            with c.stream(
                "POST",
                f"{ep.orch}/v1/research/stream",
                headers=HEADERS,
                json={"question": "What does the mcp tools server expose?", "max_iterations": 1},
                timeout=120.0,
            ) as s:
                events = 0
                for line in s.iter_lines():
                    if line.startswith("data:"):
                        events += 1
                        if events >= 2:
                            break
                check(
                    "orchestrator: /v1/research/stream emits SSE events",
                    events >= 2,
                    f"events={events}",
                )

    failed = [c for c in CHECKS if not c[1]]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} checks passed")
    for name, _, detail in failed:
        print(f"  FAILED: {name} {detail}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
