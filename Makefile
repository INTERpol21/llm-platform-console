# One-command verification of the whole platform. Every session that touched a
# client, URL or Dockerfile ended up rebuilding this exact pipeline by hand —
# now it is: make verify        (stack + cross-service smoke)
#            make verify E2E=1  (same + the Playwright browser suite)
#
# VERIFY_PORT (default 18000) is where Caddy is published; 8080 is habitually
# taken by other local dev servers. Python deps come via `uv run --with httpx`,
# so no venv is needed. The stack is torn down even when a check fails.
VERIFY_PORT ?= 18000
COMPOSE_VERIFY = docker compose -f docker-compose.yml -f docker-compose.verify.yml

.PHONY: verify verify-up verify-down

verify:
	@bash -ec ' \
	  trap "$(COMPOSE_VERIFY) down" EXIT; \
	  VERIFY_PORT=$(VERIFY_PORT) $(COMPOSE_VERIFY) up -d --build --wait; \
	  SMOKE_CADDY_PORT=$(VERIFY_PORT) uv run --with httpx python scripts/platform_smoke.py; \
	  if [ "$(E2E)" = "1" ]; then \
	    E2E_BASE_URL=http://127.0.0.1:$(VERIFY_PORT) pnpm --filter @console/web test:e2e; \
	  fi; \
	  echo "verify: OK"'

# Bring the verify stack up / down without running checks (debugging aid).
verify-up:
	VERIFY_PORT=$(VERIFY_PORT) $(COMPOSE_VERIFY) up -d --build --wait

verify-down:
	$(COMPOSE_VERIFY) down

# --- Demo data ---------------------------------------------------------------
# demo-seed copies the curated corpus into ./dropbox; the rag folder connector
# ingests it within ~5 s (content-hash dedup makes re-seeding free).
# demo-reset wipes what public visitors wrote and re-seeds: truncates the rag
# tables (documents/chunks — NOT the orchestrator/telemetry schemas), flushes
# Redis (exact + usage + breaker state) and re-copies the seed. Run it on a
# schedule on the public stand so the demo does not rot.

.PHONY: demo-seed demo-reset

demo-seed:
	cp demo/seed/*.md dropbox/
	@echo "demo-seed: corpus copied; the folder connector picks it up within ~5s"

demo-reset:
	docker compose exec -T postgres psql -U $${POSTGRES_USER:-platform} -d $${POSTGRES_DB:-platform} \
	  -c "TRUNCATE chunks, documents"
	docker compose exec -T redis redis-cli FLUSHALL >/dev/null
	$(MAKE) demo-seed
	@echo "demo-reset: rag tables truncated, redis flushed, corpus re-seeded"
