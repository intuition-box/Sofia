/**
 * ScoreExplanationDialog — explains how a topic score was derived.
 *
 * The score is driven by the user's on-chain certifications tagged
 * "in context of <topic>": each one is worth POINTS_PER_CERT. (Platform
 * signal scoring is not in service, so the breakdown is cert-based.)
 */

import type { TopicScoreExplanation } from '@/types/reputation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface ScoreExplanationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicLabel: string
  topicColor: string
  explanation: TopicScoreExplanation | undefined
}

export default function ScoreExplanationDialog({
  open,
  onOpenChange,
  topicLabel,
  topicColor,
  explanation,
}: ScoreExplanationDialogProps) {
  if (!explanation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How {topicLabel} score is calculated</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            No breakdown available yet.
          </p>
        </DialogContent>
      </Dialog>
    )
  }

  const { finalScore, trustBonus, certCount, certPoints } = explanation

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Why is your {topicLabel} score {finalScore}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Certifications drive the score. */}
          <section className="flex justify-between">
            <div>
              <div>Certifications in this topic</div>
              <p className="text-xs text-muted-foreground">
                {certCount === 0
                  ? `Tag certs with "in context of ${topicLabel}" to grow this.`
                  : `${certCount} cert${certCount > 1 ? 's' : ''} × 5 pts`}
              </p>
            </div>
            <span className="tabular-nums">
              {certPoints > 0 ? `+${certPoints}` : '—'}
            </span>
          </section>

          {trustBonus > 0 && (
            <section className="flex justify-between">
              <span>Trust score bonus</span>
              <span className="tabular-nums">+{trustBonus}</span>
            </section>
          )}

          {/* Final */}
          <section className="flex justify-between pt-3 border-t border-border font-semibold">
            <span>Final score</span>
            <span
              className="tabular-nums text-lg"
              style={{ color: topicColor }}
            >
              {finalScore}
            </span>
          </section>

          <p className="text-xs text-muted-foreground pt-2">
            Your {topicLabel} score grows with every page you certify in this
            topic.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
