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
