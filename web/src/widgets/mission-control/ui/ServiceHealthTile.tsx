import {
  type ServiceDescriptor,
  ServiceHealthCard,
  type ServiceHealthCardLabels,
  useServiceHealth,
} from '../../../entities/service-health/index.ts';

interface ServiceHealthTileProps {
  service: ServiceDescriptor;
  labels: ServiceHealthCardLabels;
}

/**
 * One live service tile. Wrapping the query in its own component keeps the
 * per-service `useServiceHealth` hook out of a `.map` callback (rules-of-hooks)
 * and lets each tile refetch independently.
 */
export function ServiceHealthTile({ service, labels }: ServiceHealthTileProps) {
  const { data, isLoading } = useServiceHealth(service);
  return <ServiceHealthCard labels={labels} health={data} isLoading={isLoading} />;
}
