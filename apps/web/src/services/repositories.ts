import { get } from "./http";
import type { Repository, RepositoryDetailResponse, RepositorySummary, RepositorySnapshot } from "@/types/api";

export function listRepositories(query?: string, language?: string): Promise<Repository[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (language) params.set("language", language);
  const qs = params.toString();
  return get<Repository[]>(`/repositories${qs ? `?${qs}` : ""}`);
}

export function getRepository(id: number): Promise<RepositoryDetailResponse> {
  return get<RepositoryDetailResponse>(`/repositories/${id}`);
}

export function getRepositoryByOwner(owner: string, repo: string): Promise<RepositoryDetailResponse> {
  return get<RepositoryDetailResponse>(`/repositories/by-name/${owner}/${repo}`);
}

export function getRepositorySummary(id: number): Promise<RepositorySummary> {
  return get<RepositorySummary>(`/repositories/${id}/summary`);
}

export function getRepositorySnapshots(id: number): Promise<RepositorySnapshot[]> {
  return get<RepositorySnapshot[]>(`/repositories/${id}/snapshots`);
}
