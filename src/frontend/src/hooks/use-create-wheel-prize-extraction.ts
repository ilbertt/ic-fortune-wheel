import { useMutation } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';
import { useAuth } from '@/hooks/use-auth';
import { extractOk } from '@/lib/api';
import { useEffect, useRef } from 'react';

const EXTRACTION_RESULT_RESET_TIMEOUT_MS = 20_000;

export function useCreateWheelPrizeExtraction() {
  const { actor } = useAuth();
  const isExtractingRef = useRef(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mutation = useMutation({
    mutationFn: async (principal: Principal) => {
      if (isExtractingRef.current) {
        return;
      }

      isExtractingRef.current = true;

      const result = await actor.create_wheel_prize_extraction({
        extract_for_principal: principal,
      });
      return extractOk(result);
    },
    onSettled: () => {
      scheduleReset();
      isExtractingRef.current = false;
    },
  });

  const scheduleReset = () => {
    // Clear any existing timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // Set a new timeout
    resetTimeoutRef.current = setTimeout(() => {
      mutation.reset();
    }, EXTRACTION_RESULT_RESET_TIMEOUT_MS);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return mutation;
}
