import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'What is Sofia?',
    },
    {
      type: 'doc',
      id: 'features/getting-started',
      label: 'Getting Started',
    },
    {
      type: 'category',
      label: 'User Guide',
      items: [
        {
          type: 'category',
          label: 'Core Concepts',
          items: [
            'core-concepts/atoms',
            'core-concepts/triples',
            'core-concepts/predicates',
          ],
        },
        {
          type: 'category',
          label: 'Features',
          items: [
            'features/echoes',
            'features/intentions',
            'features/certifications',
            'features/bookmarks-signals',
          ],
        },
        {
          type: 'category',
          label: 'Gamification',
          items: [
            'gamification/currencies-levels',
            'gamification/quests-discovery',
            'gamification/streaks-voting',
            'gamification/badges-rewards',
          ],
        },
        {
          type: 'category',
          label: 'AI Features',
          items: [
            'ai-features/pulse-analysis',
            'ai-features/interest-analysis',
            'ai-features/chat-predicates',
          ],
        },
        {
          type: 'category',
          label: 'Resonance',
          items: [
            'resonance/circle-feed',
            'resonance/trending',
            'resonance/vote',
            'resonance/featured-lists',
            'resonance/leaderboard',
          ],
        },
        {
          type: 'category',
          label: 'Social',
          items: [
            'social/verification',
            'social/following-trust',
          ],
        },
        {
          type: 'category',
          label: 'Known Issues',
          items: [
            'known-issues/transactions',
            'known-issues/social-verification',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Litepaper',
      items: [
        'litepaper/introduction',
        'litepaper/network',
        'litepaper/subscription',
        'litepaper/dao',
        'litepaper/features',
        'litepaper/privacy',
        'litepaper/why-unique',
        'litepaper/audience',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
      ],
    },
    {
      type: 'category',
      label: 'Ecosystem',
      items: [
        'ecosystem/phala',
        'ecosystem/gaianet',
        'ecosystem/mastra',
        'ecosystem/intuition',
      ],
    },
  ],
};

export default sidebars;
