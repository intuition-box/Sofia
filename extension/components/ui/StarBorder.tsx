import type { ElementType, ComponentPropsWithoutRef, ReactNode, CSSProperties } from 'react';
import '../styles/StarBorder.css';

type StarBorderProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: ReactNode;
  color?: string;
  speed?: CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends ElementType = 'button'>({
  as,
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`star-border-container ${className}`}
      {...(rest as Record<string, unknown>)}
      style={{
        padding: `${thickness}px 0`,
        ...style
      }}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div className="inner-content">{children}</div>
    </Component>
  );
};

export default StarBorder;
