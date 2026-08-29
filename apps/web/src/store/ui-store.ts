import { create } from "zustand";

interface UIState {
  searchQuery: string;
  selectedLanguage: string;
  selectedTimeRange: "7d" | "14d" | "30d" | "90d";
  selectedSort: string;
  setSearchQuery: (q: string) => void;
  setSelectedLanguage: (lang: string) => void;
  setSelectedTimeRange: (range: "7d" | "14d" | "30d" | "90d") => void;
  setSelectedSort: (sort: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: "",
  selectedLanguage: "",
  selectedTimeRange: "30d",
  selectedSort: "Trend Score",
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
  setSelectedTimeRange: (range) => set({ selectedTimeRange: range }),
  setSelectedSort: (sort) => set({ selectedSort: sort }),
}));
