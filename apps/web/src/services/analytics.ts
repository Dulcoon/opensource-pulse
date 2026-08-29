import { get } from "./http";
import type { AnalyticsResponse } from "@/types/api";

export function getAnalytics(range?: string): Promise<AnalyticsResponse> {
  const qs = range ? `?range=${range}` : "";
  return get<AnalyticsResponse>(`/analytics${qs}`);
}
