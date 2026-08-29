import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/services/analytics";
import type { AnalyticsResponse } from "@/types/api";

export function useAnalytics(range?: string) {
  return useQuery<AnalyticsResponse>({
    queryKey: ["analytics", range],
    queryFn: () => getAnalytics(range),
  });
}
