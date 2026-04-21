/**
 * ScoreExplanationDialog — explains to the user how a topic score was derived.
 *
 * Reads the TopicScoreExplanation attached by reputationScoreService to a
 * TopicScore, renders it as:
 *   - per-platform contribution bars with their top metrics
 *   - trust bonus line (if any)
 *   - multi-source multiplier line with reason
 *   - final clamp line if the cap was hit
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

/**
 * Raw metric keys come from the signal fetchers in a mix of French and
 * English. Translate the known ones; fall back to a cleaned-up key for
 * anything not in the map.
 */
const METRIC_LABELS: Record<string, string> = {
  // GitHub
  streak_jours: 'daily streak',
  commits_moy_quotidien: 'avg daily commits',
  repos_actifs: 'active repos',
  stars_recus: 'stars received',
  langages_distincts: 'distinct languages',
  repos_total: 'total repos',
  // YouTube / video
  videos_postees: 'videos posted',
  vues_totales: 'total views',
  avg_views_per_video: 'avg views/video',
  avg_likes_per_video: 'avg likes/video',
  avg_comments_per_video: 'avg comments/video',
  // Spotify / music
  diversite_genres: 'genre diversity',
  playlists_creees: 'playlists created',
  top_artists_count: 'top artists',
  top_tracks_count: 'top tracks',
  avg_track_popularity: 'avg track popularity',
  // Discord
  serveurs_specialises: 'specialized servers',
  roles_obtenus: 'earned roles',
  moderator_guilds: 'moderated servers',
  owned_guilds: 'owned servers',
  // Twitch
  heures_stream_mois: 'stream hours / month',
  // Reddit
  subreddits_actifs: 'active subreddits',
  comment_karma: 'comment karma',
  link_karma: 'link karma',
  total_karma: 'total karma',
  // Strava / sports
  activites_mois: 'activities / month',
  km_mois: 'km / month',
  total_km: 'total km',
  ytd_runs: 'runs (YTD)',
  ytd_rides: 'rides (YTD)',
  friend_count: 'friends',
  // Shared — account age
  anciennete_mois: 'account age (months)',
}

function labelFor(key: string): string {
  return METRIC_LABELS[key] ?? key.replace(/_/g, ' ')
}

function formatMetric(key: string, value: number): string {
  const label = labelFor(key)
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 100) / 100
  return `${label}: ${rounded}`
}

export default function ScoreExplanationDialog({
  open, onOpenChange, topicLabel, topicColor, explanation,
}: ScoreExplanationDialogProps) {
  if (!explanation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How {topicLabel} score is calculated</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">No breakdown available yet.</p>
        </DialogContent>
      </Dialog>
    )
  }

  const {
    finalScore,
    platformSubtotal, platformContributions,
    trustBonus, multiSourceMultiplier, multiSourceReason,
  } = explanation

  const totalContrib = platformContributions.reduce((s, c) => s + c.rawContribution, 0) || 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Why is your {topicLabel} score {finalScore}?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Platform contributions */}
          <section>
            <h4 className="font-medium mb-2">Signals from your connected platforms</h4>
            {platformContributions.length === 0 ? (
              <p className="text-muted-foreground">
                No connected platform produced signals for this topic yet. Connect
                one to start building a score.
              </p>
            ) : (
              <div className="space-y-2">
                {platformContributions.map((c) => {
                  const pct = (c.rawContribution / totalContrib) * 100
                  return (
                    <div key={c.platformId} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-medium">{c.platformName}</span>
                        <span className="tabular-nums text-muted-foreground">
                          +{Math.round(c.rawContribution)} pts
                        </span>
                      </div>
                      <div className="h-1.5 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: topicColor }}
                        />
                      </div>
                      {c.topMetrics.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {c.topMetrics.map((m) => formatMetric(m.key, m.value)).join(' · ')}
                        </p>
                      )}
                    </div>
                  )
                })}
                <div className="flex justify-between pt-1 text-muted-foreground border-t border-border">
                  <span>Platform subtotal</span>
                  <span className="tabular-nums">{platformSubtotal}</span>
                </div>
              </div>
            )}
          </section>

          {/* Trust bonus */}
          {trustBonus > 0 && (
            <section className="flex justify-between">
              <span>Trust score bonus <span className="text-muted-foreground">(composite × 0.2)</span></span>
              <span className="tabular-nums">+{trustBonus}</span>
            </section>
          )}

          {/* Multi-source */}
          <section className="flex justify-between">
            <div>
              <div>Cross-platform adjustment</div>
              <p className="text-xs text-muted-foreground">{multiSourceReason}</p>
            </div>
            <span className="tabular-nums">
              {multiSourceMultiplier === 0 ? '—' : `×${multiSourceMultiplier.toFixed(2)}`}
            </span>
          </section>

          {/* Final */}
          <section className="flex justify-between pt-3 border-t border-border font-semibold">
            <span>Final score</span>
            <span className="tabular-nums text-lg" style={{ color: topicColor }}>
              {finalScore}
            </span>
          </section>

          <p className="text-xs text-muted-foreground pt-2">
            Connecting more platforms removes the single-source penalty and unlocks
            higher bonuses. Each platform contributes via creation, regularity,
            community, monetization and seniority signals.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
