import { useScrollAnim } from '../hooks/useScrollAnim';
import { ParallaxBg } from './ParallaxBg';
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
  const titleRef = useScrollAnim();
  const subRef = useScrollAnim();
  const tableRef = useScrollAnim();

  return (
    <ParallaxBg src="/img/bg5.png" speed={0.15} zoom zoomMax={1.1} className={styles.section}>
      <div className="container">
        <h2 ref={titleRef} className={`section-title anim ${styles.centered}`}>Sofia vs. the status quo.</h2>
        <p ref={subRef} className={`section-subtitle anim ${styles.sub}`}>A transparent, user-first approach to digital identity.</p>


        <table ref={tableRef as React.Ref<HTMLTableElement>} className={`${styles.table} anim`}>
          <thead>
            <tr>
              <th className={styles.accent}>Sofia</th>
              <th>Web2 Platforms</th>
              <th>Web3 Native</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>
                    <span className={CHECK[i][j] ? styles.check : styles.cross}>
                      {CHECK[i][j] ? '✓' : '×'}
                    </span>{' '}
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ParallaxBg>
  );
}
