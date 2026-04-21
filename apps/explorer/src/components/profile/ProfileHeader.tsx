import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import '../styles/page-header.css'

interface ProfileHeaderProps {
  walletAddress: string
  ensName?: string
  avatar?: string
  onShare?: () => void
  sharing?: boolean
}

export default function ProfileHeader({
  walletAddress,
  ensName,
  avatar,
  onShare,
  sharing,
}: ProfileHeaderProps) {
  const displayName = ensName || walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
  const initials = (ensName || walletAddress).slice(0, 2).toUpperCase()

  return (
    <Card className="p-6">
      <div className="flex items-center gap-6">
        <Avatar className="shrink-0 border-2 border-border ph-avatar">
          {avatar && <AvatarImage src={avatar} alt={displayName} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate">{displayName}</h1>
          <span className="text-sm text-muted-foreground tabular-nums">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </div>

        {onShare && (
          <Button size="sm" variant="outline" onClick={onShare} disabled={sharing} className="gap-1.5 shrink-0">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {sharing ? 'Sharing...' : 'Share'}
          </Button>
        )}
      </div>
    </Card>
  )
}
