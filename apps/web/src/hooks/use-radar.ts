import { useQuery } from "@tanstack/react-query";
import { getRadar } from "@/services/radar";
import type { TechnologyScore } from "@/types/api";

export function useRadar() {
  return useQuery<TechnologyScore[]>({
    queryKey: ["radar"],
    queryFn: getRadar,
    refetchInterval: 6 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
  });
}
