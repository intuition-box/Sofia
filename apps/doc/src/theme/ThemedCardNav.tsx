import React from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import CardNav from '@site/src/components/CardNav';

export default function ThemedCardNav(): JSX.Element {
  const {colorMode, setColorMode} = useColorMode();
  const isDark = colorMode === 'dark';

  const toggleDarkMode = () => {
    setColorMode(isDark ? 'light' : 'dark');
  };

  const menuItems = [
    {
      label: "Docs",
      bgColor: "var(--ds-accent-soft)",
      textColor: "var(--ds-ink)",
      links: [
        { label: "Documentation", href: "/docs/intro", ariaLabel: "Read Documentation" },
        { label: "Manifesto", href: "/docs/manifesto", ariaLabel: "Read Manifesto" },
        { label: "About us", href: "/docs/about", ariaLabel: "About us" },
        { label: "Litepaper", href: "/docs/litepaper/introduction", ariaLabel: "Read the Litepaper" },
        { label: "Architecture", href: "/docs/architecture/overview", ariaLabel: "Read the Architecture overview" },
      ],
    },
    {
      label: "Community",
      bgColor: "var(--ds-card)",
      textColor: "var(--ds-ink)",
      links: [
        { label: "GitHub", href: "https://github.com/intuition-box", ariaLabel: "View on GitHub" },
        { label: "X", href: "https://x.com/0xsofia3", ariaLabel: "Follow us on X" },
        { label: "Discord", href: "https://discord.gg/sofia3", ariaLabel: "Join our Discord" },
        { label: "Proxy Dashboard", href: "https://sofia-proxy.intuition.box/", ariaLabel: "Sofia Fee Proxy Dashboard" },
      ],
    },
  ];

  return (
    <CardNav
      logo={isDark ? "/img/logoWhite.svg" : "/img/logoDark.svg"}
      logoAlt="Sofia Logo"
      items={menuItems}
      topLink={{ label: "Chronicles", href: "/blog", ariaLabel: "Sofia Chronicles" }}
      baseColor="var(--ds-bg-subtle)"
      menuColor="var(--ds-ink)"
      buttonBgColor="var(--ds-accent)"
      buttonTextColor="var(--ds-on-accent)"
      ease="circ.out"
      isDark={isDark}
      onToggleDarkMode={toggleDarkMode}
    />
  );
}
