import { useState } from 'react'
import { CopyIcon } from '../icons'

/**
 * Code block — ported from the design `Code`. The design colors
 * tokens via manual `<span class="k|s|c|f|n|t|p">` markup inside
 * `code`; that is preserved by rendering `code` as raw HTML. A
 * real Prism/Shiki highlighter can replace the manual markup in
 * the MDX pass without touching this shell. The copy button is
 * now functional (the design's was decorative).
 */
export function Code({
  lang = 'TypeScript',
  filename,
  code,
}: {
  lang?: string
  filename?: string
  /** HTML string — may contain the design's token <span> markup. */
  code: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const plain = code.replace(/<[^>]+>/g, '')
    void navigator.clipboard?.writeText(plain).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      },
      () => {},
    )
  }

  return (
    <div className="code">
      <div className="code-bar">
        <span className="lang">{lang}</span>
        {filename && <span>· {filename}</span>}
        <button className="copy" onClick={copy} type="button">
          <CopyIcon />
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre dangerouslySetInnerHTML={{ __html: code }} />
    </div>
  )
}
