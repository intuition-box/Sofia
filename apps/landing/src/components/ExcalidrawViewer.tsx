import React, { useEffect, useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

type ExcalidrawInitialData = {
  elements?: any[];
  appState?: Record<string, any>;
  files?: Record<string, any>;
};

export default function ExcalidrawViewer({ src }: { src: string }) {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<any>(null);
  const [data, setData] = useState<ExcalidrawInitialData>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;

    const loadExcalidraw = async () => {
      try {
        const mod = await import('@excalidraw/excalidraw');
        // Import CSS dynamically
        await import('@excalidraw/excalidraw/index.css');
        setExcalidrawComponent(() => mod.Excalidraw);
      } catch (err) {
        console.error('Error loading Excalidraw:', err);
        setError('Failed to load Excalidraw component');
      }
    };
    loadExcalidraw();
  }, []);

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) return;

    const loadJSON = async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Fetch error ${res.status}`);
        const json = await res.json();
        const { elements, files, appState } = json;

        const customAppState = {
          ...appState,
          viewBackgroundColor: appState?.viewBackgroundColor || '#ffffff',
          zoom: { value: 0.7 },
          scrollX: 100,
          scrollY: 50,
        };

        setData({ elements, appState: customAppState, files });
      } catch (err) {
        console.error('Error loading Excalidraw JSON:', err);
        setError('Failed to load diagram data');
      }
    };
    loadJSON();
  }, [src]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!ExcalidrawComponent) return <p>Loading Excalidraw component...</p>;
  if (!data) return <p>Loading diagram...</p>;

  return (
    <div style={{
      height: 700,
      border: '2px solid #e0e0e0',
      borderRadius: 12,
      marginBottom: '2rem',
      overflow: 'hidden',
      background: '#ffffff'
    }}>
      <ExcalidrawComponent
        initialData={data}
        viewModeEnabled={true}
        zenModeEnabled={false}
        gridModeEnabled={false}
      />
    </div>
  );
}
