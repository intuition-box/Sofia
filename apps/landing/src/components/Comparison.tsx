import { useScrollAnim } from '../hooks/useScrollAnim';
import { useTextSplit } from '../hooks/useTextSplit';
import styles from './Comparison.module.css';

const ROWS = [
  ['Data on your device', 'Data harvested', 'On-chain, public'],
  ['Open-source', 'Black box', 'Open protocols'],
  ['Earn from contribution', 'Platform extracts', 'Pay to play'],
  ['AI-powered insights', 'Biased recs', 'No personalization'],
  ['Verified identity', 'Self-declared', 'Pseudonymous'],
  ['Community governance', 'Corporate control', 'Token voting'],
] as const;

const CHECK = [
  [true, false, true],
  [true, false, true],
  [true, false, false],
  [true, true, false],
  [true, false, false],
  [true, false, true],
];

export function Comparison() {
  const headerRef = useScrollAnim<HTMLDivElement>();
  const titleRef = useTextSplit<HTMLHeadingElement>({ by: 'word' });
  const tableRef = useScrollAnim<HTMLTableElement>();

  return (
    <section className={styles.section}>
      <div className="container">
        <div ref={headerRef} className={`${styles.header} anim anim-up`}>
          <span className="mono-eyebrow">Why Sofia</span>
          <h2 ref={titleRef} className={`section-title anim ${styles.title}`}>
            Sofia vs. the status quo.
          </h2>
          <p className="section-subtitle">A transparent, user-first approach to digital identity.</p>
        </div>

        <table ref={tableRef} className={`${styles.table} anim anim-up anim-d2`}>
          <thead>
            <tr>
              <th className={styles.headSofia}>Sofia</th>
              <th>Web2 platforms</th>
              <th>Web3 native</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={j === 0 ? styles.tdSofia : undefined}>
                    <span className={CHECK[i][j] ? styles.check : styles.cross} aria-hidden="true">
                      {CHECK[i][j] ? '✓' : '×'}
                    </span>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
