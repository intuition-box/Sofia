import { useState, useCallback, useMemo } from 'react'
import type { TopicScore } from '@/types/reputation'
import {
  type ShareProfileParams,
  buildOgImageUrl,
  createShareLink,
  copyToClipboard,
  buildTwitterShareUrl,
} from '@/services/shareProfileService'

interface UseShareProfileParams {
  walletAddress: string
  topicScores: TopicScore[]
  connectedCount: number
  totalCertifications: number
}

export function useShareProfile({
  walletAddress,
  topicScores,
  connectedCount,
  totalCertifications,
}: UseShareProfileParams) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const serviceParams: ShareProfileParams = useMemo(
    () => ({ walletAddress, topicScores, connectedCount, totalCertifications }),
    [walletAddress, topicScores, connectedCount, totalCertifications],
  )

  const ogImageUrl = useMemo(
    () => buildOgImageUrl(serviceParams),
    [serviceParams],
  )

  const openShareModal = useCallback(async () => {
    setIsModalOpen(true)
    setError(null)
    setShareUrl(null)
    setIsLoading(true)

    try {
      const url = await createShareLink(serviceParams)
      setShareUrl(url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [serviceParams])

  const closeShareModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return
    await copyToClipboard(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  const handleShareOnX = useCallback(() => {
    if (!shareUrl) return
    window.open(buildTwitterShareUrl(shareUrl), '_blank')
  }, [shareUrl])

  return {
    isModalOpen,
    openShareModal,
    closeShareModal,
    shareUrl,
    ogImageUrl,
    isLoading,
    error,
    handleCopyLink,
    handleShareOnX,
    copied,
  }
}
