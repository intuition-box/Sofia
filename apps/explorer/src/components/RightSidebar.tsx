import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Star, Activity } from "lucide-react";
import TrendingPages from './TrendingPages';
import './styles/layout.css'

const TOPIC_ICONS: Record<string, string> = {
  'tech-dev': '💻', 'design-creative': '🎨', 'music-audio': '🎵', gaming: '🎮',
  'web3-crypto': '⛓️', science: '🔬', 'sport-health': '🏋️', 'video-cinema': '📹',
  entrepreneurship: '🚀', 'performing-arts': '🎭', 'nature-environment': '🌿',
  'food-lifestyle': '🍽️', literature: '📚', 'personal-dev': '🧠',
}

export function RightSidebar({ hidden = false }: { hidden?: boolean }) {
  // Placeholder suggested accounts with good scores in user's topics
  const suggestedAccounts = [
    { address: '0x1a2b...3c4d', score: 87, topic: 'tech-dev' },
    { address: '0x5e6f...7g8h', score: 74, topic: 'design-creative' },
    { address: '0x9i0j...1k2l', score: 91, topic: 'web3-crypto' },
  ]

  return (
    <aside className={`fixed right-0 top-0 overflow-y-auto z-40 rs-aside ${hidden ? 'rs-hidden' : ''}`}>
      <div className="p-4 space-y-6" style={{ zoom: 1.25 }}>
        {/* Suggested Accounts */}
        <Card style={{ gap: 0 }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4" />
              Top Reputations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedAccounts.map((account) => (
              <div key={account.address} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">{account.address.slice(2, 4).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{account.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {TOPIC_ICONS[account.topic]} Score: {account.score}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-center text-muted-foreground pt-1">
              Connect to discover more profiles
            </p>
          </CardContent>
        </Card>

        {/* Trending Pages */}
        <TrendingPages />

        {/* Live Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground text-center py-4">
              Activity from your trust circle will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
