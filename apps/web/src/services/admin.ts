import { post } from "./http";
import { env } from "@/lib/env";

export interface ActionResponse {
  message?: string;
  [key: string]: unknown;
}

export function triggerSyncRepositories(): Promise<ActionResponse> {
  return post<ActionResponse>("/sync/repositories");
}

export function triggerCalculateRadar(): Promise<ActionResponse> {
  return post<ActionResponse>("/radar/calculate");
}

export function triggerGenerateInsight(): Promise<ActionResponse> {
  return post<ActionResponse>("/reports/generate-insight");
}

export function triggerGenerateReport(): Promise<ActionResponse> {
  return post<ActionResponse>("/reports/generate");
}

export async function checkSystemHealth(): Promise<{ status: string; url: string }> {
  const baseUrl = env.apiUrl.replace(/\/api$/, "");
  try {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { status: data.status || "ok", url: baseUrl };
  } catch {
    return { status: "offline", url: baseUrl };
  }
}
