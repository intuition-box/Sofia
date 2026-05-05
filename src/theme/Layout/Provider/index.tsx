import React from 'react';
import OriginalLayoutProvider from '@theme-original/Layout/Provider';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function LayoutProvider({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <OriginalLayoutProvider>
      <BrowserOnly>
        {() => {
          const ThemedCardNav = require('@site/src/theme/ThemedCardNav').default;
          return <ThemedCardNav />;
        }}
      </BrowserOnly>
      {children}
    </OriginalLayoutProvider>
  );
}
