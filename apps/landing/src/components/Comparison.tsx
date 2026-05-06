import { Section } from './Section';
import { SectionHead } from './SectionHead';
import { Plate } from './Plate';
import { HexSplit } from './HexSplit';
import styles from './Comparison.module.css';

const ROWS = [
  { label: 'DATA RESIDENCY', sofia: 'On your device', web2: 'Harvested at scale', web3: 'Public by default' },
  { label: 'SOURCE CODE', sofia: 'Open source', web2: 'Black box', web3: 'Open protocols' },
  { label: 'VALUE FLOW', sofia: 'To contributors', web2: 'To the platform', web3: 'Pay to play' },
  { label: 'PERSONALIZATION', sofia: 'Local AI, your rules', web2: 'Engagement loops', web3: 'None' },
  { label: 'IDENTITY MODEL', sofia: 'Verified by action', web2: 'Self-declared', web3: 'Pseudonymous' },
  { label: 'GOVERNANCE', sofia: 'Contribution-based', web2: 'Corporate control', web3: 'Token-weighted' },
] as const;

const FLAGS: readonly (readonly [boolean, boolean, boolean])[] = [
  [true, false, true],
  [true, false, true],
  [true, false, false],
  [true, true, false],
  [true, false, false],
  [true, false, true],
];

export function Comparison() {
  return (
    <Section
      id="why"
      code="S.03"
      label="COMPARATIVE"
      meta="DELTA · STATUS QUO"
      variant="peach"
      decoration={<HexSplit size="680px" color="rgba(0,0,0,0.045)" />}
    >
      <SectionHead
        eyebrow="Sofia vs. status quo"
        title={
          <>
            The same web,<br />
            <em>measured differently.</em>
          </>
        }
        sub="Three operating models for the modern web. Only one returns the value of your attention to you. Read the table."
        variant="peach"
      />

      <Plate
        tag="PLATE.C"
        title="Delta · Sofia vs status quo"
        meta={['6 AXES', '3 MODELS']}
        foot={['SOFIA · 6 / 6 DELTA', 'READING · COMPARATIVE']}
        variant="cmp-dark"
        body="flush"
        className={styles.cmpPlate}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th />
              <th className={styles.headSofia}>SOFIA</th>
              <th>WEB2 PLATFORMS</th>
              <th>WEB3 NATIVE</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.label}>
                <td className={styles.rowLabel}>{row.label}</td>
                <td className={styles.tdSofia}>
                  <Cell ok={FLAGS[i][0]} text={row.sofia} />
                </td>
                <td>
                  <Cell ok={FLAGS[i][1]} text={row.web2} />
                </td>
                <td>
                  <Cell ok={FLAGS[i][2]} text={row.web3} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Plate>
    </Section>
  );
}

function Cell({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={styles.cell}>
      <span className={ok ? styles.check : styles.cross} aria-hidden="true">
        {ok ? '✓' : '×'}
      </span>
      {text}
    </span>
  );
}
