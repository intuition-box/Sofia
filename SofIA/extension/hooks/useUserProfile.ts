/**
 * useUserProfile Hook  
 * Manages user profile data with IndexedDB
 * Handles profile photo, bio, and profile URL
 */

import { useState, useEffect, useCallback } from 'react'
import { userProfileService } from '~lib/indexedDB-methods'
import type { ProfileRecord } from '~lib/indexedDB'

interface UseUserProfileResult {
  // Profile data
  profile: ProfileRecord | null
  profilePhoto: string | undefined
  bio: string
  profileUrl: string
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  updateProfilePhoto: (photoData: string) => Promise<void>
  updateBio: (bio: string) => Promise<void>
  updateProfileUrl: (url: string) => Promise<void>
  updateProfile: (updates: Partial<ProfileRecord>) => Promise<void>
  refreshProfile: () => Promise<void>
  resetProfile: () => Promise<void>
  
  // Utilities
  hasProfile: boolean
  isProfileComplete: boolean
  getProfileCompletionPercentage: () => number
}

interface UseUserProfileOptions {
  autoLoad?: boolean
  defaultBio?: string
  defaultProfileUrl?: string
}

/**
 * Hook for managing user profile data
 */
export const useUserProfile = (options: UseUserProfileOptions = {}): UseUserProfileResult => {
  const {
    autoLoad = true,
    defaultBio = 'Passionate about technology, digital identity, and decentralized systems.',
    defaultProfileUrl = 'https://sofia.network/profile/username'
  } = options

  // State
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load profile from IndexedDB
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const profileData = await userProfileService.getProfile()
      
      if (profileData) {
        setProfile(profileData)
        console.log('👤 Profile loaded successfully')
      } else {
        // Create default profile if none exists
        await userProfileService.saveProfile(
          undefined, // no photo
          defaultBio,
          defaultProfileUrl
        )
        
        // Load the newly created profile
        const newProfile = await userProfileService.getProfile()
        setProfile(newProfile)
        console.log('👤 Default profile created and loaded')
      }

    } catch (err) {
      console.error('❌ Error loading profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [defaultBio, defaultProfileUrl])

  /**
   * Update profile photo
   */
  const updateProfilePhoto = useCallback(async (photoData: string) => {
    try {
      setIsSaving(true)
      setError(null)

      await userProfileService.updateProfilePhoto(photoData)
      
      // Refresh profile after update
      await loadProfile()
      
      console.log('📷 Profile photo updated successfully')

    } catch (err) {
      console.error('❌ Error updating profile photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile photo')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [loadProfile])

  /**
   * Update bio
   */
  const updateBio = useCallback(async (bio: string) => {
    try {
      setIsSaving(true)
      setError(null)

      await userProfileService.updateBio(bio)
      
      // Refresh profile after update
      await loadProfile()
      
      console.log('📝 Bio updated successfully')

    } catch (err) {
      console.error('❌ Error updating bio:', err)
      setError(err instanceof Error ? err.message : 'Failed to update bio')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [loadProfile])

  /**
   * Update profile URL
   */
  const updateProfileUrl = useCallback(async (url: string) => {
    try {
      setIsSaving(true)
      setError(null)

      // Basic URL validation
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Profile URL must start with http:// or https://')
      }

      await userProfileService.updateProfileUrl(url)
      
      // Refresh profile after update
      await loadProfile()
      
      console.log('🔗 Profile URL updated successfully')

    } catch (err) {
      console.error('❌ Error updating profile URL:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile URL')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [loadProfile])

  /**
   * Update multiple profile fields at once
   */
  const updateProfile = useCallback(async (updates: Partial<ProfileRecord>) => {
    try {
      setIsSaving(true)
      setError(null)

      // Extract the fields we can update
      const { profilePhoto, bio, profileUrl } = updates
      
      await userProfileService.saveProfile(profilePhoto, bio, profileUrl)
      
      // Refresh profile after update
      await loadProfile()
      
      console.log('👤 Profile updated successfully')

    } catch (err) {
      console.error('❌ Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [loadProfile])

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  /**
   * Reset profile to defaults
   */
  const resetProfile = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      await userProfileService.saveProfile(
        undefined, // clear photo
        defaultBio,
        defaultProfileUrl
      )
      
      // Refresh profile after reset
      await loadProfile()
      
      console.log('🔄 Profile reset to defaults')

    } catch (err) {
      console.error('❌ Error resetting profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset profile')
    } finally {
      setIsSaving(false)
    }
  }, [defaultBio, defaultProfileUrl, loadProfile])

  /**
   * Calculate profile completion percentage
   */
  const getProfileCompletionPercentage = useCallback((): number => {
    if (!profile) return 0

    let completedFields = 0
    let totalFields = 3

    // Bio is required
    if (profile.bio && profile.bio.trim().length > 0) {
      completedFields++
    }

    // Profile URL is required  
    if (profile.profileUrl && profile.profileUrl.trim().length > 0) {
      completedFields++
    }

    // Profile photo is optional but adds to completion
    if (profile.profilePhoto && profile.profilePhoto.length > 0) {
      completedFields++
    }

    return Math.round((completedFields / totalFields) * 100)
  }, [profile])

  // Derived state
  const profilePhoto = profile?.profilePhoto
  const bio = profile?.bio || ''
  const profileUrl = profile?.profileUrl || ''
  const hasProfile = profile !== null
  const isProfileComplete = getProfileCompletionPercentage() === 100

  /**
   * Load profile on mount if autoLoad is enabled
   */
  useEffect(() => {
    if (autoLoad) {
      loadProfile()
    }
  }, [autoLoad, loadProfile])

  return {
    // Profile data
    profile,
    profilePhoto,
    bio,
    profileUrl,
    
    // Loading states
    isLoading,
    isSaving,
    error,
    
    // Actions
    updateProfilePhoto,
    updateBio,
    updateProfileUrl,
    updateProfile,
    refreshProfile,
    resetProfile,
    
    // Utilities
    hasProfile,
    isProfileComplete,
    getProfileCompletionPercentage
  }
}

/**
 * Simplified hook for just reading profile data
 */
export const useProfileData = () => {
  const {
    profile,
    profilePhoto,
    bio,
    profileUrl,
    isLoading,
    error,
    hasProfile,
    isProfileComplete,
    getProfileCompletionPercentage
  } = useUserProfile({ autoLoad: true })

  return {
    profile,
    profilePhoto,
    bio,
    profileUrl,
    isLoading,
    error,
    hasProfile,
    isProfileComplete,
    completionPercentage: getProfileCompletionPercentage()
  }
}

/**
 * Hook for profile photo management specifically
 */
export const useProfilePhoto = () => {
  const { profilePhoto, updateProfilePhoto, isSaving, error } = useUserProfile()

  const uploadPhoto = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const photoData = e.target?.result as string
          await updateProfilePhoto(photoData)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [updateProfilePhoto])

  const clearPhoto = useCallback(async (): Promise<void> => {
    await updateProfilePhoto('')
  }, [updateProfilePhoto])

  return {
    profilePhoto,
    uploadPhoto,
    clearPhoto,
    isSaving,
    error,
    hasPhoto: !!profilePhoto && profilePhoto.length > 0
  }
}

export default useUserProfile