import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/services/dashboard";
import type { DashboardResponse } from "@/types/api";

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 6 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
  });
}
