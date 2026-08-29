import { create } from "zustand";

interface RadarState {
  selectedTechName: string;
  setSelectedTechName: (name: string) => void;
}

export const useRadarStore = create<RadarState>((set) => ({
  selectedTechName: "",
  setSelectedTechName: (name) => set({ selectedTechName: name }),
}));
