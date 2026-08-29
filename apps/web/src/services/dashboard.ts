import { get } from "./http";
import type { DashboardResponse } from "@/types/api";

export function getDashboard(): Promise<DashboardResponse> {
  return get<DashboardResponse>("/dashboard");
}
