import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/services/dashboard";
import type { DashboardRange, DashboardResponse } from "@/types/api";

export function useDashboard(range: DashboardRange = "7d") {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard", range],
    queryFn: () => getDashboard(range),
    refetchInterval: 6 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
  });
}
