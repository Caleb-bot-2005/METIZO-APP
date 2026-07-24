import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { reviewService } from '@/services/reviewService';
import { Job, ProgressStage } from '@/types/job';

// Polls so status/progress changes (customer confirms, artisan updates
// progress, a bid gets accepted elsewhere) show up without a manual refresh —
// this list is read by both the customer's job screens and the artisan's
// "My Work" tab.
export function useJobs() {
  return useQuery({ queryKey: ['jobs'], queryFn: jobService.list, refetchInterval: 5000 });
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

// Artisan-side: the open marketplace feed — this is the screen artisans watch
// for new work, so it needs to update on its own rather than sitting static
// until they background/reopen the app.
export function useJobFeed(category?: string) {
  return useQuery({
    queryKey: ['jobs', 'feed', category ?? 'all'],
    queryFn: () => jobService.listOpenFeed(category),
    refetchInterval: 5000,
  });
}

export function useMarkInProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobService.markInProgress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

// Artisan-side: report a work checkpoint (materials purchased / almost done / done).
export function useUpdateJobProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Exclude<ProgressStage, 'started'> }) => jobService.updateProgress(id, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

// Customer-side: confirm the work is done, releasing escrow to the artisan.
export function useConfirmCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobService.confirmCompletion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

// Customer-side: permanently remove a cancelled job from history.
export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

// Customer-side: rate a completed job — feeds the artisan's trust score.
export function useLeaveReview() {
  return useMutation({
    mutationFn: ({ id, rating, comment }: { id: string; rating: number; comment: string }) =>
      reviewService.leaveReview(id, rating, comment),
  });
}
