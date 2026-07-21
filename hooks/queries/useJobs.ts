import { useMutation, useQuery } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { Job } from '@/types/job';

export function useJobs() {
  return useQuery({ queryKey: ['jobs'], queryFn: jobService.list });
}

export function useCreateJob() {
  return useMutation({ mutationFn: (job: Partial<Job>) => jobService.create(job) });
}

export function useJobEstimate() {
  return useMutation({
    mutationFn: ({ description, categoryId }: { description: string; categoryId: string }) =>
      jobService.getEstimate(description, categoryId),
  });
}

// Artisan-side: the open marketplace feed.
export function useJobFeed(category?: string) {
  return useQuery({ queryKey: ['jobs', 'feed', category ?? 'all'], queryFn: () => jobService.listOpenFeed(category) });
}

export function useMarkInProgress() {
  return useMutation({ mutationFn: (id: string) => jobService.markInProgress(id) });
}
