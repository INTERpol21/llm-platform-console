import { Activity } from 'lucide-react';
import type { PingResult } from '../../../entities/models/index.ts';
import { Button, Spinner } from '../../../shared/ui/index.ts';
import { usePingModel } from '../model/usePingModel.ts';

export interface PingButtonLabels {
  action: string;
  pinging: string;
}

export interface PingButtonProps {
  modelId: string;
  labels: PingButtonLabels;
  onResult?: (result: PingResult) => void;
}

/** Triggers a reachability probe and hands the result to the parent widget. */
export function PingButton({ modelId, labels, onResult }: PingButtonProps) {
  const ping = usePingModel(onResult);

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={ping.isPending}
      onClick={() => ping.mutate(modelId)}
    >
      {ping.isPending ? <Spinner size={14} /> : <Activity size={14} />}
      {ping.isPending ? labels.pinging : labels.action}
    </Button>
  );
}
