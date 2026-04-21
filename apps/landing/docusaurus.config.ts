import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import React from 'react';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Sofia Chronicles',
  tagline: 'Sofia',
  favicon: 'img/favicon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://sofia.intuition.box',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Sofia', // Usually your GitHub org/user name.
  projectName: 'Sofia Chronicles', // Usually your repo name.

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
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
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
              to: '/docs/introduction',
            },
            {
              label: 'Sofia Values',
              to: '/values',
            },
            {
              label: 'Sofia Chronicles',
              to: '/blog',
            },
            {
              label: 'Proxy Dashboard',
              href: 'https://sofia-proxy.intuition.box/',
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
              href: 'https://x.com/Sofia_Intuition',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/intuition',
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    require('./plugins/webpack-plugin.cjs').webpackPlugin,
  ],
};

export default config;
