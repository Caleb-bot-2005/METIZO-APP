import { create } from 'zustand';

interface TabTransitionState {
  activeIndex: number;
  previousIndex: number;
  setActiveIndex: (index: number) => void;
}

export const useTabTransitionStore = create<TabTransitionState>((set, get) => ({
  activeIndex: 0,
  previousIndex: 0,
  setActiveIndex: (index) => {
    const current = get().activeIndex;
    if (current === index) return;
    set({ previousIndex: current, activeIndex: index });
  },
}));
