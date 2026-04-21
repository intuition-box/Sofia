import type {
  UserReputationProfile,
  UserInterestSelection,
  PlatformConnection,
} from "./reputation"

export interface DashboardProfile {
  walletAddress: string
  ensName?: string
  avatar?: string
  onChainData: {
    certificationCount: number
    pioneerCount: number
    trustVolume: number
    txCount: number
  }
  interests: UserInterestSelection
  connections: PlatformConnection[]
  reputation: UserReputationProfile | null
}

export type ProfileTab =
  | "overview"
  | "domains"
  | "platforms"
  | "scores"

export interface OnboardingStep {
  step: "domains" | "niches" | "platforms" | "complete"
  progress: number
}
