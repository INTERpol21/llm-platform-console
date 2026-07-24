# Embeddings through one gate

Every vector in the platform is produced through the gateway's
/v1/embeddings endpoint: the RAG service does not talk to providers
directly. One entrypoint means one usage ledger, one place for retries,
fallbacks and circuit breakers, and per-key cost accounting for free.

Each embedder carries a fingerprint of its vector space (model + dimension).
The store records which fingerprint wrote it; on startup a mismatch triggers
an automatic re-embed of the corpus under a Postgres advisory lock, so N
replicas never duplicate the work and mixed vector spaces never serve.
