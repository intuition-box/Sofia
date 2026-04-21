import { Separator } from './ui/separator'

export default function FooterCTA() {
  return (
    <footer className="mt-8">
      <Separator />
      <div className="flex items-center justify-between py-4 text-xs text-muted-foreground">
        <span>Sofia — Own your attention data</span>
        <span>Live from Intuition Protocol (Base)</span>
      </div>
    </footer>
  )
}
