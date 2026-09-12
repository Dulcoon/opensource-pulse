import { get } from "./http";
import type { DashboardRange, DashboardResponse } from "@/types/api";

export function getDashboard(range: DashboardRange = "7d"): Promise<DashboardResponse> {
  return get<DashboardResponse>(`/dashboard?range=${range}`);
}
