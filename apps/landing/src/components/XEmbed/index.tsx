import React, { useEffect, useRef } from 'react';

interface XEmbedProps {
  url: string;
  width?: string | number;
  height?: string | number;
}

export default function XEmbed({ url, width = '100%', height = '500px' }: XEmbedProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widgets script if not already loaded
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);

      script.onload = () => {
        if (containerRef.current && window.twttr?.widgets) {
          window.twttr.widgets.load(containerRef.current);
        }
      };
    } else if (containerRef.current && window.twttr?.widgets) {
      // If script is already loaded, just load widgets in this container
      window.twttr.widgets.load(containerRef.current);
    }
  }, [url]);

  return (
    <div
      ref={containerRef}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        maxWidth: '100%',
        margin: '2rem auto',
        minHeight: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      <blockquote className="twitter-tweet" data-lang="en">
        <a href={url}></a>
      </blockquote>
    </div>
  );
}

// TypeScript declaration for Twitter widgets
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}
