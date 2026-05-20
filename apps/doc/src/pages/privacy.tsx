import React from 'react'
import Layout from '@theme/Layout'
import ContentWrapper from '@site/src/components/ContentWrapper'

export default function Privacy(): React.ReactElement {
  return (
    <Layout title="Privacy Policy" description="Sofia Extension Privacy Policy">
      <main className="theme-doc-markdown">
        <ContentWrapper>
          <article className="privacy-page">
            <h1>Privacy Policy</h1>
            <p>
              <strong>Last updated: May 18, 2026</strong>
            </p>

            <h2>1. Introduction</h2>
            <p>
              Sofia is a browser extension that lets users Mark the web pages
              they read with an intention (learning, work, inspiration, trust…)
              and publish those Marks as verifiable records on the Intuition
              blockchain. Sofia does not run any AI model, recommendation
              engine, or content-analysis service.
            </p>
            <p>
              This Privacy Policy explains what data we collect, how and why we
              process it, how it is stored, when it is shared, and what control
              you have over your data.
            </p>
            <p>
              <strong>
                Sofia does not operate any data center, server, or centralized
                database to store your personal data.
              </strong>{' '}
              All user data is stored locally on your device in Chrome's
              extension storage. The only data that exists outside your device
              is what you explicitly choose to publish on the blockchain — a
              user-initiated action that always requires your wallet approval.
            </p>
            <p>
              By installing or using Sofia, you agree to the practices described
              in this Privacy Policy.
            </p>

            <h2>2. Data We Collect</h2>

            <h3>2.1 Browsing Activity (Off by Default, User Opt-In)</h3>
            <p>
              Browsing tracking is <strong>disabled by default</strong>. Sofia
              collects nothing until the user explicitly enables tracking
              during onboarding or in Settings. When the user opts in, Sofia
              collects:
            </p>
            <ul>
              <li>
                Page URLs visited (tracking parameters such as utm_*, fbclid,
                gclid are automatically removed)
              </li>
              <li>
                Page titles (common site suffixes such as "– YouTube" are
                removed)
              </li>
              <li>
                Page metadata (keywords, description, Open Graph type, primary
                headings)
              </li>
              <li>Time spent on each page</li>
              <li>Timestamps of visits</li>
            </ul>
            <p>To protect user privacy:</p>
            <ul>
              <li>
                A minimum 3-second threshold is required before a visit is
                recorded
              </li>
              <li>
                Sensitive pages are automatically excluded, including:
                <ul>
                  <li>Login and authentication flows</li>
                  <li>Banking, payment, and checkout pages</li>
                  <li>Email providers</li>
                  <li>CAPTCHA services</li>
                  <li>Advertising and tracking networks</li>
                </ul>
              </li>
            </ul>
            <p>
              Tracking can be disabled at any time in the extension settings.
            </p>

            <h3>2.2 Browsing History and Bookmarks (Limited Access)</h3>
            <p>Sofia uses Chrome's APIs with strict limits:</p>
            <ul>
              <li>
                <strong>History:</strong> Reads up to 300 recent URLs (URLs
                only, no page content) to extract themes and match intention
                groups
              </li>
              <li>
                <strong>Bookmarks:</strong> Reads up to 500 bookmarks (URL and
                title only) during onboarding to initialize user preferences
              </li>
            </ul>
            <p>
              All entries are filtered to exclude sensitive patterns such as
              login, bank, payment, auth, password, checkout, admin, OAuth, and
              CAPTCHA.
            </p>

            <h3>2.3 Wallet Information</h3>
            <p>When you connect a wallet, Sofia may collect:</p>
            <ul>
              <li>Ethereum wallet address (via EIP-6963 wallet discovery)</li>
              <li>Wallet provider name (e.g. MetaMask, Rabby)</li>
              <li>
                On-chain interactions with the Intuition Protocol (signals,
                certifications, deposits)
              </li>
            </ul>
            <p>
              Sofia never accesses or stores private keys, seed phrases, or
              wallet balances, except where strictly required by your wallet
              provider to sign a transaction.
            </p>

            <h3>2.4 Social / OAuth Connections (Optional)</h3>
            <p>
              When you voluntarily connect a social account, Sofia requests
              read-only access only:
            </p>
            <ul>
              <li>
                <strong>YouTube:</strong> Channel info, playlists, subscriptions
                (scope: youtube.readonly)
              </li>
              <li>
                <strong>Spotify:</strong> Profile, followed artists, top
                tracks/artists (scopes: user-read-private, user-follow-read,
                user-top-read)
              </li>
              <li>
                <strong>Twitch:</strong> Profile, followed channels (scopes:
                user:read:follows, user:read:subscriptions)
              </li>
              <li>
                <strong>Discord:</strong> Profile, email, guild membership
                (scopes: identify, email, guilds)
              </li>
              <li>
                <strong>Twitter/X:</strong> Profile information only (scopes:
                users.read, tweet.read)
              </li>
            </ul>
            <p>
              OAuth access and refresh tokens are stored locally, isolated per
              wallet address.
            </p>

            <h3>2.5 User Preferences</h3>
            <ul>
              <li>
                Browser dark/light mode preference (used only for UI theme
                matching)
              </li>
            </ul>

            <h2>3. Legal Basis for Processing (GDPR)</h2>
            <p>
              Sofia processes personal data under the following legal bases:
            </p>
            <ul>
              <li>
                <strong>User consent (Art. 6(1)(a))</strong> — for browsing
                tracking, OAuth connections, and wallet interactions
              </li>
              <li>
                <strong>Legitimate interest (Art. 6(1)(f))</strong> — to
                operate, secure, and improve core extension functionality
              </li>
              <li>
                <strong>Contractual necessity (Art. 6(1)(b))</strong> — to
                provide services explicitly requested by the user
              </li>
            </ul>
            <p>
              You may withdraw consent at any time via the extension settings.
            </p>

            <h2>4. How We Use Your Data</h2>
            <p>Sofia processes data locally for the following purposes:</p>
            <ul>
              <li>URL normalization and metadata cleanup before display</li>
              <li>Grouping browsed URLs by domain into Echoes intention groups</li>
              <li>Building the Marks the user explicitly publishes on-chain</li>
              <li>Quest progression and XP tracking</li>
              <li>Grouping browsing activity into temporary sessions</li>
            </ul>
            <p>
              Sofia performs no AI inference, no recommendation, and no content
              analysis. Session data is cleared when the browser restarts.
            </p>

            <h2>5. Data Storage and Retention</h2>

            <h3>5.1 Local Storage</h3>
            <p>Most data is stored locally using Chrome's extension storage:</p>
            <ul>
              <li>OAuth tokens and social data</li>
              <li>Quest progress and XP</li>
              <li>Browsing session data</li>
              <li>User preferences and settings</li>
              <li>Intention group data</li>
            </ul>

            <h3>5.2 Per-Wallet Data Isolation</h3>
            <p>
              All data is isolated per wallet address. When a different wallet
              is detected, the previous wallet's local data is cleared.
            </p>

            <h3>5.3 Retention Periods</h3>
            <ul>
              <li>
                <strong>Session data:</strong> Cleared on browser restart
              </li>
              <li>
                <strong>Quest tracking:</strong> Retained up to 120 days
              </li>
              <li>
                <strong>OAuth tokens:</strong> Stored until disconnected by the
                user
              </li>
              <li>
                <strong>Local data:</strong> Retained until cleared or extension
                is uninstalled
              </li>
              <li>
                <strong>Blockchain data:</strong> Permanent and publicly visible
                by design
              </li>
            </ul>

            <h2>6. Data Sharing and External Services</h2>
            <p>
              <strong>
                Sofia does not sell, rent, or share personal data for
                advertising or marketing purposes.
              </strong>
            </p>

            <h3>6.1 Intuition Protocol (Blockchain)</h3>
            <p>
              User-initiated actions (signals, certifications, deposits) are
              written on-chain. On-chain data is public and immutable.
            </p>

            <h3>6.2 Intuition GraphQL API</h3>
            <p>
              Read-only queries are used to retrieve public blockchain data. No
              personal data is transmitted.
            </p>

            <h3>6.3 OAuth Platform APIs</h3>
            <p>
              When connected, Sofia communicates with the respective platform
              APIs to retrieve the data described in Section 2.4.
            </p>

            <h3>6.4 Authentication (Privy)</h3>
            <p>
              Wallet authentication is handled via Privy. Authentication tokens
              and wallet connection metadata are exchanged securely.
            </p>

            <h3>6.5 IPFS</h3>
            <p>
              Metadata for published signals may be stored on IPFS, a
              decentralized and public storage network.
            </p>

            <h2>7. Chrome Permissions Justification</h2>
            <p>
              Sofia requests permissions strictly necessary for its
              functionality, including: storage, history, tabs, activeTab,
              sidePanel, bookmarks, identity, offscreen, scripting, and host
              permissions (all URLs).
            </p>
            <p>
              Each permission is used solely for the purposes described in this
              policy.
            </p>

            <h2>8. User Controls and Rights</h2>
            <p>You can:</p>
            <ul>
              <li>Enable or disable browsing tracking</li>
              <li>Clear all local data</li>
              <li>Disconnect your wallet</li>
              <li>Revoke OAuth connections</li>
              <li>
                View all on-chain activity publicly via the{' '}
                <a
                  href="https://explorer.intuition.systems"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Intuition block explorer
                </a>
              </li>
            </ul>
            <p>
              Under GDPR, you may also request access, deletion, or restriction
              of your personal data where applicable.
            </p>

            <h2>9. Data Security</h2>
            <ul>
              <li>Local data is encrypted using Chrome's storage mechanisms</li>
              <li>Wallet actions require explicit user approval</li>
              <li>No passwords, private keys, or seed phrases are stored</li>
              <li>HTTPS is enforced for all external communications</li>
              <li>OAuth state parameters are cryptographically protected</li>
              <li>RPC and GraphQL requests are rate-limited and cached</li>
            </ul>

            <h2>10. Children's Privacy</h2>
            <p>
              Sofia is not intended for users under 13 years of age. We do not
              knowingly collect data from children under 13.
            </p>

            <h2>11. International Data Transfers</h2>
            <p>
              Some services used by Sofia operate outside your country of
              residence. By using Sofia, you consent to such transfers in
              accordance with applicable data protection laws.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be reflected in the "Last updated" date. Continued use of Sofia
              constitutes acceptance of the updated policy.
            </p>

            <h2>13. Contact</h2>
            <p>For privacy questions or data requests:</p>
            <ul>
              <li>
                GitHub Issues:{' '}
                <a
                  href="https://github.com/intuition-box/Sofia/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/intuition-box/Sofia/issues
                </a>
              </li>
            </ul>
          </article>
        </ContentWrapper>
      </main>
    </Layout>
  )
}
