import { useQuery } from '@tanstack/react-query'
import { fetchTopicCertifications, type TopicCertification } from '@/services/topicCertificationsService'

export function useTopicCertifications(topicId?: string, walletAddress?: string) {
  const { data, isLoading } = useQuery<TopicCertification[]>({
    queryKey: ['topic-certifications', topicId, walletAddress],
    queryFn: () => fetchTopicCertifications(topicId!, walletAddress),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return {
    certifications: data ?? [],
    loading: isLoading && !data,
  }
}
