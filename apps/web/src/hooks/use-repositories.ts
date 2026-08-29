import { useQuery } from "@tanstack/react-query";
import { listRepositories, getRepository, getRepositoryByOwner, getRepositorySummary, getRepositorySnapshots } from "@/services/repositories";
import type { Repository, RepositoryDetailResponse, RepositorySummary, RepositorySnapshot } from "@/types/api";

export function useRepositories(query?: string, language?: string) {
  return useQuery<Repository[]>({
    queryKey: ["repositories", query, language],
    queryFn: () => listRepositories(query, language),
  });
}

export function useRepository(id: number) {
  return useQuery<RepositoryDetailResponse>({
    queryKey: ["repository", id],
    queryFn: () => getRepository(id),
    enabled: !!id,
  });
}

export function useRepositoryByOwner(owner: string, repo: string) {
  return useQuery<RepositoryDetailResponse>({
    queryKey: ["repository", owner, repo],
    queryFn: () => getRepositoryByOwner(owner, repo),
    enabled: !!owner && !!repo,
  });
}

export function useRepositorySummary(id: number) {
  return useQuery<RepositorySummary>({
    queryKey: ["repository", id, "summary"],
    queryFn: () => getRepositorySummary(id),
    enabled: !!id,
  });
}

export function useRepositorySnapshots(id: number) {
  return useQuery<RepositorySnapshot[]>({
    queryKey: ["repository", id, "snapshots"],
    queryFn: () => getRepositorySnapshots(id),
    enabled: !!id,
  });
}
