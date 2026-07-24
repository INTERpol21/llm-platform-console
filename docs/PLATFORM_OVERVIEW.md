# AI Platform — обзор портфолио (github.com/INTERpol21)

Пять связанных репозиториев: четыре Python/FastAPI-бэкенда и TypeScript-консоль
над ними. Вместе — работающий мини-стек AI-платформы, который поднимается офлайн
одной командой, без единого реального API-ключа (мок-провайдер, детерминированные
эмбеддинги, заглушка поиска). Реальные провайдеры подключаются конфигом.

Этот документ — обзор всей платформы. README каждого репозитория описывает сам
репозиторий; решения зафиксированы в [ADR](adr/README.md), незакрытые работы — в
[ROADMAP](ROADMAP.md).

## Репозитории

| Репо | Что демонстрирует | Порт | Версия |
|---|---|---|---|
| [llm-gateway](https://github.com/INTERpol21/llm-gateway) | OpenAI-совместимый шлюз: каталог моделей и ping, YAML-роутинг с wildcard, SSE-стриминг, фолбэки/ретраи, Redis-кэш + semantic cache, circuit breakers, rate-limit, учёт токенов и стоимости | 8080 | 1.3.0 |
| [rag-pgvector](https://github.com/INTERpol21/rag-pgvector) | RAG на pgvector: ингест (md/txt/pdf/docx) + folder watch, гибридный поиск (вектор + BM25/FTS через RRF), reranker, цитаты источников, eval-харнес и promptfoo OWASP-LLM гейт | 8081 | 1.6.0 |
| [mcp-tools-server](https://github.com/INTERpol21/mcp-tools-server) | MCP-сервер (FastMCP): инструменты + resources, sqlite-authorizer, песочница путей, stdio + streamable-http (bearer) | 8082 | 1.1.1 |
| [agent-orchestrator](https://github.com/INTERpol21/agent-orchestrator) | LangGraph-агент: план → параллельный execute → рефлексия → синтез; SSE-стриминг, Postgres-чекпойнтер, история прогонов; оркеструет остальные три сервиса | 8083 | 1.4.0 |
| [llm-platform-console](https://github.com/INTERpol21/llm-platform-console) | React 19 + Hono BFF: шесть разделов (Research, Models, Usage, Knowledge, Telemetry, Mission-control), FSD, контракты через Kubb, i18n RU/EN, umbrella compose | 5173 / BFF 8787 / Caddy 8080 | 1.4.2 |

Актуальный план и чеклисты — [ROADMAP.md](ROADMAP.md) (секция **Project map**);
история по-русски — [HISTORY.ru.md](HISTORY.ru.md).

## Карта: кто за что отвечает

| Репо | Владеет (ответственность) | Входящие | Исходящие вызовы |
|---|---|---|---|
| **llm-gateway** | Единый вход к моделям: роутинг, кэш (exact + semantic), брейкеры, стоимость | BFF, orchestrator, rag | Провайдеры LLM/embeddings; Redis; Postgres `telemetry` |
| **rag-pgvector** | Корпус знаний и поиск с цитатами | BFF, orchestrator | gateway (embeddings + синтез); Postgres `rag` |
| **mcp-tools-server** | Инструменты агента (поиск/SQL/файлы) | orchestrator (streamable-http) | — |
| **agent-orchestrator** | Исследовательский агент и SSE-трейс | BFF | gateway, rag, mcp; Postgres `orchestrator` |
| **llm-platform-console** | Лицо платформы + BFF + зонтик docker compose | Browser через Caddy | gateway, rag, orchestrator (**mcp health — пробел, см. M7a**) |

## Связи сервисов

```mermaid
graph LR
    U[Browser] --> Caddy[Caddy :8080]
    Caddy --> W[console web<br/>React 19, FSD]
    Caddy --> BFF[Hono BFF<br/>keys, rate-limit, SSE]
    BFF -->|/v1| GW[llm-gateway :8080]
    BFF -->|/v1| RAG[rag-pgvector :8081]
    BFF -->|/v1| AO[agent-orchestrator :8083]
    AO -->|chat completions| GW
    AO -->|/v1/query| RAG
    AO -->|MCP streamable-http| MCP[mcp-tools-server :8082]
    RAG -->|embeddings + синтез| GW
    GW --> P1[OpenAI]
    GW --> P2[Anthropic]
    GW --> P3[Ollama / китайские провайдеры]
    GW --> P4[Mock offline]
    RAG --> DB[(Postgres + pgvector)]
    AO --> DB
    GW --> DB
    GW --> R[(Redis cache + breakers)]
```

**Проверяемые связки** (`scripts/platform_smoke.py`): completion+кэш шлюза;
ingest+query rag с ростом ledger на gateway; MCP tools по HTTP; research SSE
end-to-end. **Не покрыто smoke/UI:** MCP на health board консоли; list/delete
документов; semantic-cache hit на публичном стенде (opt-in, по умолчанию off).

Браузер ходит только в BFF — единый origin, ключи не уезжают в клиент
([ADR-0008](adr/0008-bff-single-origin.md)). Все бэкенды говорят на общем
префиксе `/v1` ([ADR-0007](adr/0007-unified-v1-prefix.md)), поэтому BFF —
тонкий прокси, а не слой перевода.

## Запуск всей платформы

Зонтичный compose поднимает всё: Postgres, Redis, четыре бэкенда, BFF, Caddy и
опциональный Ollama.

```bash
cd llm-platform-console
docker compose up -d --build --wait
```

Кросс-сервисный смоук поверх поднятого стека:

```bash
python scripts/platform_smoke.py
```

Он проверяет реальные связи, а не отдельные сервисы: completion и кэш шлюза,
ингест и цитируемый ответ rag (синтез идёт через шлюз — виден в `/v1/usage`),
инструменты MCP по streamable-http, `/v1/research` оркестратора end-to-end.
Браузерную часть покрывает Playwright + axe (`web/e2e`).

Отдельные сервисы для разработки — см. README соответствующего репозитория; у
каждого есть `make install && make run` и офлайн-дефолты.

## Инженерная база

Во всех пяти репозиториях: слоистый скелет (`api` / `services` / `db` /
`core`), uv + lockfile и mypy-гейт на Python-стороне, структурные JSON-логи со
сквозным `X-Request-ID`, non-root Docker с HEALTHCHECK, CI с ruff/pytest и
security-гейтами (pip-audit, bandit, CodeQL, Dependabot), ADR и CONTRIBUTING.
У rag дополнительно eval-гейт по hit-rate и promptfoo-прогон на границе синтеза.
