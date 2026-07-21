import { create } from 'zustand';
import { Job, JobPhoto, JobTiming } from '@/types/job';

interface DraftJob {
  categoryId?: string;
  categoryName?: string;
  description?: string;
  photos: JobPhoto[];
  latitude?: number;
  longitude?: number;
  address?: string;
  budgetMin?: number;
  budgetMax?: number;
  aiEstimatedPrice?: number;
  timing?: JobTiming;
  scheduledAt?: string;
}

interface JobState {
  draft: DraftJob;
  jobs: Job[];
  activeJobId: string | null;
  updateDraft: (patch: Partial<DraftJob>) => void;
  resetDraft: () => void;
  addJob: (job: Job) => void;
  setJobs: (jobs: Job[]) => void;
  setActiveJob: (id: string) => void;
  updateJobStatus: (id: string, status: Job['status']) => void;
}

const emptyDraft: DraftJob = { photos: [] };

export const useJobStore = create<JobState>((set) => ({
  draft: emptyDraft,
  jobs: [],
  activeJobId: null,
  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: emptyDraft }),
  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs], activeJobId: job.id })),
  // Merges server-fetched jobs with anything created locally this session that the
  // fetch doesn't know about yet (e.g. the instant right after posting a request).
  setJobs: (jobs) =>
    set((s) => {
      const fetchedIds = new Set(jobs.map((j) => j.id));
      const localOnly = s.jobs.filter((j) => !fetchedIds.has(j.id));
      return { jobs: [...localOnly, ...jobs] };
    }),
  setActiveJob: (id) => set({ activeJobId: id }),
  updateJobStatus: (id, status) =>
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, status } : j)) })),
}));
