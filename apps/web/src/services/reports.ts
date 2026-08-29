import { get, post } from "./http";
import type { WeeklyReport } from "@/types/api";

export function listReports(): Promise<WeeklyReport[]> {
  return get<WeeklyReport[]>("/reports");
}

export function getReport(id: number): Promise<WeeklyReport> {
  return get<WeeklyReport>(`/reports/${id}`);
}

export function generateInsight(): Promise<void> {
  return post<void>("/reports/generate-insight");
}

export function generateReport(): Promise<WeeklyReport> {
  return post<WeeklyReport>("/reports/generate");
}
