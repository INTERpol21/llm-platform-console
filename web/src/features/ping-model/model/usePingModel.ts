import { useMutation } from '@tanstack/react-query';
import type { PingResult } from '../../../entities/models/index.ts';
import { pingModel } from '../../../entities/models/index.ts';

/** Mutation wrapper around the gateway ping probe. */
export function usePingModel(onResult?: (result: PingResult) => void) {
  return useMutation({
    mutationFn: (modelId: string) => pingModel(modelId),
    onSuccess: (result) => onResult?.(result),
  });
}
