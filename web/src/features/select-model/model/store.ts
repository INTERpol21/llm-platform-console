import { create } from 'zustand';

interface SelectedModelState {
  selectedModelId: string | null;
  setSelectedModel: (id: string | null) => void;
}

/** Global selection of the "active" model, shared across widgets. */
export const useSelectedModel = create<SelectedModelState>((set) => ({
  selectedModelId: null,
  setSelectedModel: (id) => set({ selectedModelId: id }),
}));
