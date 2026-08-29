import { get } from "./http";
import type { TechnologyScore } from "@/types/api";

export function getRadar(): Promise<TechnologyScore[]> {
  return get<TechnologyScore[]>("/radar");
}
