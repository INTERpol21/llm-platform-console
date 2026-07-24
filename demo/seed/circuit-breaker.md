# Circuit breaker in the LLM gateway

Retries handle transient blips; the circuit breaker handles a provider that
is persistently down. After N consecutive failures the circuit trips OPEN
and requests skip that provider immediately, failing over to the next
fallback instead of paying the timeout every time.

After a cooldown the circuit goes HALF-OPEN and admits exactly one probe.
Success closes it; failure re-opens it. With REDIS_URL set, breaker state is
shared across replicas via TTL keys, so the whole fleet trips and recovers
as one — and a SET NX gate guarantees a single probe fleet-wide.
