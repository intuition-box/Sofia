import React, { Suspense, lazy } from "react"
import "./Background.css"
import fondImage from "./fond.png"

const PixelBlast = lazy(() => import("./PixelBlast"))

interface BackgroundProps {
  className?: string;
}

const Background = ({ className }: BackgroundProps) => {
  return (
    <>
      <div className={`animated-background ${className || ''}`}>
        <img className="fond" src={fondImage} alt="" />
        <Suspense fallback={null}>
          <PixelBlast
            variant="diamond"
            pixelSize={3}
            color="#b0b0b0"
            patternScale={2.5}
            patternDensity={0}
            pixelSizeJitter={0}
            enableRipples={false}
            speed={2}
            edgeFade={0.1}
            liquid={false}
            transparent={true}
          />
        </Suspense>
      </div>
    </>
  );
};

export default Background;