import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { Copy, Check, ExternalLink } from 'lucide-react'

interface ShareProfileModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string | null
  ogImageUrl: string
  isLoading: boolean
  error: string | null
  onCopyLink: () => void
  onShareOnX: () => void
  copied: boolean
}

export default function ShareProfileModal({
  isOpen,
  onClose,
  shareUrl,
  ogImageUrl,
  isLoading,
  error,
  onCopyLink,
  onShareOnX,
  copied,
}: ShareProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* OG Image Preview */}
          <div className="rounded-lg overflow-hidden border">
            <img src={ogImageUrl} alt="Profile preview" className="w-full" />
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {shareUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                <span className="flex-1 truncate text-muted-foreground">{shareUrl}</span>
                <Button size="sm" variant="ghost" onClick={onCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button className="w-full" onClick={onShareOnX}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Share on X
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
