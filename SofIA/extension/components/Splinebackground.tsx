import { useState, useRef } from 'react';

export default function SplineBackground() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -10
    }}>
      {/* Gradient de fallback */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite',
        opacity: videoLoaded && !videoError ? 0 : 1,
        transition: 'opacity 1s ease'
      }}>
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px) scale(1); }
            50% { transform: translate(-50%, -50%) translateY(-20px) scale(1.1); }
          }
        `}</style>
        
        {/* Forme animée de fallback */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 70%, transparent 100%)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float 6s ease-in-out infinite'
        }} />
      </div>
      
      {/* Vidéo Spline */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: videoLoaded && !videoError ? 1 : 0,
          transition: 'opacity 1s ease'
        }}
        onLoadedData={() => {
          console.log('Video loaded successfully');
          setVideoLoaded(true);
        }}
        onError={(e) => {
          console.error('Video error:', e);
          setVideoError(true);
        }}
        onEnded={() => {
          console.log('Video ended, restarting...');
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
          }
        }}
      >
        <source src={chrome.runtime.getURL('public/spline-background.webm')} type="video/webm" />
        <source src="/public/spline-background.webm" type="video/webm" />
      </video>
      
      {/* Indicateur de statut (temporaire pour debug) */}
      {true && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          fontSize: '12px',
          borderRadius: '4px',
          zIndex: 10
        }}>
          {videoError ? 'Video Error' : videoLoaded ? '_' : '_'}
        </div>
      )}
    </div>
  );
}