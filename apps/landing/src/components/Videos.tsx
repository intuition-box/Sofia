import { useScrollAnim } from '../hooks/useScrollAnim'
import { Section } from './Section'
import { SectionHead } from './SectionHead'
import styles from './Videos.module.css'

interface VideoBlock {
  tag: string
  title: string
  caption: string
  /** Public path or remote URL. Pass an empty string for placeholder. */
  src: string
  poster?: string
}

const VIDEOS: VideoBlock[] = [
  {
    tag: 'V.01',
    title: 'Driving a vision',
    caption:
      'Why Sofia exists, where it\'s going, and how you can be part of it. Six minutes for the full pitch.',
    src: '',
  },
  {
    tag: 'V.02',
    title: 'Sofia in 90 seconds',
    caption:
      'The quick tour: what you see in the extension, what ends up on your profile, and why it\'s yours.',
    src: '',
  },
]

/**
 * Videos (S.0B) — two video blocks placed right under the
 * screenshot carousel. Replaces the older "questionnaire / Facebook"
 * spot from the mock with a long-form vision pitch and a 90-second
 * product walkthrough.
 *
 * Sources are intentionally empty until assets land; the placeholder
 * shows the framing so layout can be reviewed first.
 */
export function Videos() {
  return (
    <Section id="videos" code="S.0B" label="WATCH" meta="02 VIDEOS">
      <SectionHead
        eyebrow="See it move"
        title={
          <>
            The pitch and the product tour, <em>at the right pace.</em>
          </>
        }
        sub="Two videos for two reading levels: the long-form vision and the demo that gets to the point."
      />
      <div className={`${styles.grid} stagger`}>
        {VIDEOS.map((v, i) => (
          <VideoCard key={v.tag} video={v} index={i} />
        ))}
      </div>
    </Section>
  )
}

function VideoCard({ video, index }: { video: VideoBlock; index: number }) {
  const ref = useScrollAnim<HTMLElement>()
  return (
    <figure
      ref={ref}
      className={`${styles.card} anim anim-up`}
      style={{ ['--i' as never]: index }}
    >
      <div className={styles.frame}>
        {video.src ? (
          <video
            className={styles.video}
            src={video.src}
            poster={video.poster}
            controls
            preload="metadata"
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderTag}>{video.tag}</span>
            <span className={styles.placeholderHint}>Video asset pending</span>
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.tag}>{video.tag}</span>
        <h3 className={styles.title}>{video.title}</h3>
        <p className={styles.desc}>{video.caption}</p>
      </figcaption>
    </figure>
  )
}
