import React, { useEffect, useRef, useState } from 'react';
import '../styles/NavigationBar.css';

export type DockItemData = {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
};

type DockItemProps = {
  className?: string;
  icon: JSX.Element;
  label: string;
  onClick?: () => void;
  mouseX: number;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  className = '',
  icon,
  label,
  onClick,
  mouseX,
  distance,
  magnification,
  baseItemSize
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(baseItemSize);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const itemCenterX = rect.x + rect.width / 2;
    const distanceFromMouse = Math.abs(mouseX - itemCenterX);

    if (mouseX === Infinity || distanceFromMouse > distance) {
      setSize(baseItemSize);
    } else {
      // Calculate magnification based on distance
      const scale = 1 - distanceFromMouse / distance;
      const newSize = baseItemSize + (magnification - baseItemSize) * scale;
      setSize(newSize);
    }
  }, [mouseX, distance, magnification, baseItemSize]);

  return (
    <div
      ref={ref}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transition: 'width 0.2s ease-out, height 0.2s ease-out'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
    >
      <div className="dock-icon">{icon}</div>
      {isHovered && (
        <div className="dock-label" style={{ opacity: 1 }}>
          {label}
        </div>
      )}
    </div>
  );
}

export default function Dock({
  items,
  className = '',
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50
}: DockProps) {
  const [mouseX, setMouseX] = useState(Infinity);

  return (
    <div className="dock-outer">
      <div
        onMouseMove={(e) => {
          setMouseX(e.pageX);
        }}
        onMouseLeave={() => {
          setMouseX(Infinity);
        }}
        className={`dock-panel ${className}`}
        style={{ height: `${panelHeight}px` }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          />
        ))}
      </div>
    </div>
  );
}
