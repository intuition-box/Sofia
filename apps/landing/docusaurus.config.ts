import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import React from 'react';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Sofia Documentation',
  tagline: 'Documentation & Development Blog for Sofia — the Chrome extension that turns browsing into blockchain-backed knowledge.',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://doc.sofia.intuition.box',
  baseUrl: '/',

  organizationName: 'intuition-box',
  projectName: 'Sofia-landing-page',

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:site_name',
        content: 'Sofia Documentation',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:site',
        content: '@0xsofia3',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:creator',
        content: '@0xsofia3',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/img/favicon.png',
      },
    },
  ],

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/intuition-box/sofiachronicles/blob/main/blog/',
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Sofia Chronicles',
          blogSidebarTitle: 'Last Articles',
          blogSidebarCount: 'ALL',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/Sofia_Chronicles.webp',
    metadata: [
      {name: 'keywords', content: 'sofia, documentation, blockchain, chrome extension, knowledge, web3, intuition protocol'},
      {name: 'author', content: 'Sofia Team'},
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      items: [
        {
          type: 'dropdown',
          label: 'About',
          position: 'right',
          items: [
            {
              label: 'About us',
              to: '/about',
            },
            {
              label: 'Manifesto',
              to: '/manifesto',
            },
            {
              label: 'Privacy',
              to: '/privacy',
            },
            {
              label: 'Terms',
              to: '/terms',
            },
          ],
        },
        {
          type: 'dropdown',
          label: 'Resources',
          position: 'right',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
            {
              label: 'Sofia Values',
              to: '/values',
            },
            {
              label: 'Sofia Chronicles',
              to: '/blog',
            },
          ],
        },
        {
          type: 'dropdown',
          label: 'Links',
          position: 'right',
          items: [
            {
              label: 'Github',
              href: 'https://github.com/intuition-box',
            },
            {
              label: 'X',
              href: 'https://x.com/0xsofia3',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/bDXWsV7Bb',
            },
            {
              label: 'Proxy Dashboard',
              href: 'https://sofia-proxy.intuition.box/',
            },
          ],
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          items: [
            { label: 'Discord', href: 'https://discord.gg/bDXWsV7Bb' },
            { label: 'GitHub', href: 'https://github.com/intuition-box' },
            { label: 'X', href: 'https://x.com/0xsofia3' },
            { label: 'Sofia', href: 'https://sofia.intuition.box' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Sofia`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    require('./plugins/webpack-plugin.cjs').webpackPlugin,
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs/introduction',
            to: '/docs/intro',
          },
        ],
      },
    ],
  ],
};

export default config;
