import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listReports, getReport, generateReport } from "@/services/reports";
import type { WeeklyReport } from "@/types/api";

export function useReports() {
  return useQuery<WeeklyReport[]>({
    queryKey: ["reports"],
    queryFn: listReports,
  });
}

export function useReport(id: number) {
  return useQuery<WeeklyReport>({
    queryKey: ["report", id],
    queryFn: () => getReport(id),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation<WeeklyReport, Error, void>({
    mutationFn: generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
