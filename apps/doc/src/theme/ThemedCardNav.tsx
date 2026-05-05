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
      label: "About",
      bgColor: "var(--ds-card)",
      textColor: "var(--ds-ink)",
      links: [
        { label: "About us", href: "/about", ariaLabel: "About us" },
        { label: "Manifesto", href: "/manifesto", ariaLabel: "Read Manifesto" },
        { label: "Privacy", href: "/privacy", ariaLabel: "Privacy Policy" },
        { label: "Terms", href: "/terms", ariaLabel: "Terms and Conditions" }
      ]
    },
    {
      label: "Resources",
      bgColor: "var(--ds-accent-soft)",
      textColor: "var(--ds-ink)",
      links: [
        { label: "Documentation", href: "/docs/introduction", ariaLabel: "Read Documentation" },
        { label: "Sofia Values", href: "/values", ariaLabel: "View Sofia Values" },
        { label: "Sofia Chronicles", href: "/blog", ariaLabel: "Sofia Chronicles" },
      ]
    },
    {
      label: "Links",
      bgColor: "var(--ds-card)",
      textColor: "var(--ds-ink)",
      links: [
        { label: "Github", href: "https://github.com/intuition-box", ariaLabel: "View on GitHub" },
        { label: "X", href: "https://x.com/0xsofia3", ariaLabel: "Follow us on X" },
        { label: "Discord", href: "https://discord.gg/sofia3", ariaLabel: "Join our Discord" },
        { label: "Proxy Dashboard", href: "https://sofia-proxy.intuition.box/", ariaLabel: "Sofia Fee Proxy Dashboard" }
      ]
    }
  ];

  return (
    <CardNav
      logo={isDark ? "/img/logoWhite.svg" : "/img/logoDark.svg"}
      logoAlt="Sofia Logo"
      items={menuItems}
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
