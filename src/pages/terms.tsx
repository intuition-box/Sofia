import React from 'react';
import Layout from '@theme/Layout';
import ContentWrapperWide from '@site/src/components/ContentWrapperWide';

export default function Terms(): React.ReactElement {
  return (
    <Layout
      title="Terms and Conditions"
      description="Sofia Extension Terms and Conditions">

      <main style={{ padding: '5', color: '#02000B', lineHeight: '2' }}>
        <ContentWrapperWide>
          <article>
            <h1>Terms and Conditions</h1>
            <p><strong>Last updated: January 30, 2026</strong></p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By installing, accessing, or using the Sofia browser extension ("Sofia", "the Extension"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use Sofia.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Sofia is a Chrome browser extension that analyzes your browsing activity, transforms it into structured knowledge signals, and allows you to publish them on the Intuition Protocol blockchain. Sofia provides AI-powered page analysis, content recommendations, and social account integrations.
            </p>
            <p>
              Sofia is currently in <strong>alpha/beta</strong> and is provided on an "as-is" basis. Features may change, break, or be removed without prior notice.
            </p>

            <h2>3. Eligibility</h2>
            <p>You must be at least 13 years old to use Sofia. By using the Extension, you represent and warrant that you meet this age requirement.</p>

            <h2>4. User Accounts and Wallet Connection</h2>
            <p>
              Sofia requires an Ethereum-compatible wallet to function. You are solely responsible for:
            </p>
            <ul>
              <li>Maintaining the security of your wallet and private keys</li>
              <li>All activities that occur through your wallet connection</li>
              <li>Any on-chain transactions you authorize through Sofia</li>
            </ul>
            <p>Sofia never stores or has access to your private keys or seed phrases.</p>

            <h2>5. On-Chain Actions</h2>
            <p>
              Certain actions in Sofia result in transactions on the Intuition Protocol blockchain (Base, Chain ID 8453). These include publishing signals, certifications, and deposits.
            </p>
            <p><strong>You acknowledge that:</strong></p>
            <ul>
              <li>On-chain transactions are <strong>permanent and irreversible</strong></li>
              <li>On-chain data is <strong>publicly visible</strong> to anyone</li>
              <li>Transactions may require gas fees paid in ETH</li>
              <li>Sofia is not responsible for any financial loss resulting from on-chain actions</li>
            </ul>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Reverse engineer, decompile, or disassemble the Extension</li>
              <li>Use Sofia to publish misleading, fraudulent, or harmful content on-chain</li>
              <li>Attempt to exploit, manipulate, or abuse the Intuition Protocol through Sofia</li>
              <li>Use Sofia for any illegal activity</li>
              <li>Interfere with or disrupt the Extension's services or infrastructure</li>
              <li>Use automated tools or bots to interact with Sofia</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              Sofia and its original content, features, and functionality are owned by the Sofia team and are protected by applicable intellectual property laws. The Extension is licensed, not sold, to you.
            </p>

            <h2>8. Third-Party Services</h2>
            <p>Sofia integrates with third-party services including:</p>
            <ul>
              <li><strong>Intuition Protocol</strong> — Blockchain infrastructure</li>
              <li><strong>Privy</strong> — Wallet authentication</li>
              <li><strong>OAuth providers</strong> — YouTube, Spotify, Twitch, Discord, Twitter/X</li>
              <li><strong>IPFS</strong> — Decentralized storage</li>
            </ul>
            <p>
              Your use of these services is subject to their respective terms and conditions. Sofia is not responsible for the availability, accuracy, or conduct of any third-party service.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              Sofia is provided <strong>"AS IS" and "AS AVAILABLE"</strong> without warranties of any kind, whether express or implied, including but not limited to:
            </p>
            <ul>
              <li>Merchantability or fitness for a particular purpose</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Accuracy or reliability of AI-generated analysis or recommendations</li>
              <li>Security of data stored locally or on-chain</li>
            </ul>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, the Sofia team shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul>
              <li>Loss of funds, tokens, or digital assets</li>
              <li>Loss of data or browsing history</li>
              <li>Errors in AI-generated content or recommendations</li>
              <li>Unauthorized access to your wallet or accounts</li>
              <li>Downtime or unavailability of the Extension or related services</li>
            </ul>

            <h2>11. Termination</h2>
            <p>
              You may stop using Sofia at any time by uninstalling the Extension. We reserve the right to suspend or terminate access to Sofia at our discretion, without prior notice, for any reason including violation of these Terms.
            </p>
            <p>
              Upon termination, your local data will be deleted with the Extension. On-chain data remains permanent and is not affected by termination.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Changes will be reflected in the "Last updated" date above. Continued use of Sofia after changes constitutes acceptance of the updated Terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>

            <h2>14. Contact</h2>
            <p>For questions about these Terms:</p>
            <ul>
              <li>GitHub Issues: <a href="https://github.com/intuition-box/Sofia/issues" target="_blank" rel="noopener noreferrer">https://github.com/intuition-box/Sofia/issues</a></li>
            </ul>
          </article>
        </ContentWrapperWide>
      </main>
    </Layout>
  );
}
