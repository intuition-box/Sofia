import { useEffect, useRef, useCallback } from "react"
import "../styles/XpAnimation.css"

interface XpAnimationProps {
  size?: number
  onComplete?: () => void
}

const XpAnimation = ({ size = 160, onComplete }: XpAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const spawnBurstParticles = useCallback(
    (svg: SVGSVGElement, delay: number) => {
      const ns = "http://www.w3.org/2000/svg"
      const cx = 249,
        cy = 243
      const colors = [
        "#b87830",
        "#d4a050",
        "#e8c878",
        "#ddb860",
        "#FFF8EE"
      ]
      const particles: {
        el: SVGCircleElement
        angle: number
        speed: number
        size: number
        life: number
        startDelay: number
      }[] = []
      const count = 24

      for (let i = 0; i < count; i++) {
        const angle =
          ((Math.PI * 2 * i) / count) + (Math.random() - 0.5) * 0.6
        const tier = Math.random()
        const speed =
          tier < 0.3
            ? 30 + Math.random() * 40
            : tier < 0.7
              ? 70 + Math.random() * 60
              : 130 + Math.random() * 50
        const particleSize =
          tier < 0.3
            ? 1.8 + Math.random() * 2.5
            : tier < 0.7
              ? 1.2 + Math.random() * 2
              : 0.8 + Math.random() * 1.2
        const life =
          tier < 0.3
            ? 900 + Math.random() * 400
            : tier < 0.7
              ? 600 + Math.random() * 200
              : 400 + Math.random() * 150
        const startDelay = Math.random() * 60

        const circle = document.createElementNS(ns, "circle")
        circle.setAttribute("cx", String(cx))
        circle.setAttribute("cy", String(cy))
        circle.setAttribute("r", String(particleSize))
        circle.setAttribute(
          "fill",
          colors[Math.floor(Math.random() * colors.length)]
        )
        circle.style.opacity = "0"
        svg.appendChild(circle)
        particles.push({
          el: circle,
          angle,
          speed,
          size: particleSize,
          life,
          startDelay
        })
      }

      const startTime = delay * 1000
      let startedAt: number | null = null
      let allDone = false

      function tick(timestamp: number) {
        if (!startedAt) startedAt = timestamp
        const elapsed = timestamp - startedAt

        if (elapsed < startTime) {
          requestAnimationFrame(tick)
          return
        }

        allDone = true
        particles.forEach((p) => {
          const pElapsed = elapsed - startTime - p.startDelay
          if (pElapsed < 0) {
            allDone = false
            return
          }
          const t = Math.min(pElapsed / p.life, 1)
          if (t < 1) allDone = false

          const eased = 1 - Math.pow(1 - t, p.life > 800 ? 2 : 3)
          const dist = p.speed * eased
          p.el.setAttribute("cx", String(cx + Math.cos(p.angle) * dist))
          p.el.setAttribute("cy", String(cy + Math.sin(p.angle) * dist))
          p.el.setAttribute("r", String(p.size * (1 - t * 0.6)))

          let opacity: number
          if (t < 0.05) opacity = t / 0.05
          else if (t < 0.4) opacity = 1
          else opacity = Math.max(0, 1 - (t - 0.4) / 0.6)
          p.el.style.opacity = String(opacity)
        })

        if (!allDone) {
          requestAnimationFrame(tick)
        } else {
          particles.forEach((p) => p.el.remove())
        }
      }

      requestAnimationFrame(tick)
    },
    []
  )

  const animateSRibbons = useCallback((svg: SVGSVGElement) => {
    const ribbon1 = svg.getElementById("xp-s-ribbon-1") as unknown as SVGPathElement | null
    const ribbon2 = svg.getElementById("xp-s-ribbon-2") as unknown as SVGPathElement | null
    const head1 = svg.getElementById("xp-s-head-1") as unknown as SVGCircleElement | null
    const head2 = svg.getElementById("xp-s-head-2") as unknown as SVGCircleElement | null

    if (!ribbon1 || !ribbon2) return

    const len1 = ribbon1.getTotalLength()
    const len2 = ribbon2.getTotalLength()

    ribbon1.style.strokeDasharray = String(len1)
    ribbon1.style.strokeDashoffset = String(len1)
    ribbon2.style.strokeDasharray = String(len2)
    ribbon2.style.strokeDashoffset = String(len2)

    const drawDur = 700
    const stagger = 100

    ribbon1.style.opacity = "1"
    ribbon1.animate(
      [{ strokeDashoffset: String(len1) }, { strokeDashoffset: "0" }],
      {
        duration: drawDur,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards"
      }
    )

    setTimeout(() => {
      ribbon2.style.opacity = "1"
    }, stagger)
    ribbon2.animate(
      [{ strokeDashoffset: String(-len2) }, { strokeDashoffset: "0" }],
      {
        duration: drawDur,
        delay: stagger,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards"
      }
    )

    function animateHead(
      path: SVGPathElement,
      head: SVGCircleElement | null,
      len: number,
      delay: number,
      reverse: boolean
    ) {
      if (!head) return
      let startedAt: number | null = null
      function tick(ts: number) {
        if (!startedAt) startedAt = ts
        const elapsed = ts - startedAt
        if (elapsed < delay) {
          requestAnimationFrame(tick)
          return
        }
        const t = Math.min((elapsed - delay) / drawDur, 1)
        const eased = t * t * (3 - 2 * t)
        const dist = reverse ? len * (1 - eased) : len * eased
        const pt = path.getPointAtLength(dist)
        head!.setAttribute("cx", String(pt.x))
        head!.setAttribute("cy", String(pt.y))
        head!.style.opacity =
          t < 0.05
            ? String(t / 0.05)
            : t > 0.9
              ? String((1 - t) / 0.1)
              : "1"
        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          head!.style.opacity = "0"
        }
      }
      requestAnimationFrame(tick)
    }

    animateHead(ribbon1, head1, len1, 0, false)
    animateHead(ribbon2, head2, len2, stagger, true)

    const collapseStart = drawDur + stagger + 100
    const collapseDur = 300

    setTimeout(() => {
      ribbon1.animate(
        [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(0.08)", opacity: 0 }
        ],
        {
          duration: collapseDur,
          easing: "cubic-bezier(0.6, 0, 1, 0.6)",
          fill: "forwards"
        }
      )
      ribbon2.animate(
        [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(0.08)", opacity: 0 }
        ],
        {
          duration: collapseDur,
          easing: "cubic-bezier(0.6, 0, 1, 0.6)",
          fill: "forwards"
        }
      )
      if (head1) head1.style.opacity = "0"
      if (head2) head2.style.opacity = "0"
    }, collapseStart)
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    animateSRibbons(svg)
    spawnBurstParticles(svg, 1.15)

    if (onComplete) {
      const timer = setTimeout(onComplete, 3000)
      return () => clearTimeout(timer)
    }
  }, [animateSRibbons, spawnBurstParticles, onComplete])

  return (
    <div
      ref={containerRef}
      className="xp-animation-container"
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        className="xp-animation-svg"
        width="498"
        height="497"
        viewBox="0 0 498 497"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="xp-beam-grad"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="rgba(255, 215, 80, 0.5)" />
            <stop offset="40%" stopColor="rgba(255, 215, 80, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 215, 80, 0)" />
          </linearGradient>
          <filter
            id="xp-beam-blur"
            x="-30%"
            y="-10%"
            width="160%"
            height="120%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>
          <linearGradient
            id="xp-s-grad-1"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="250"
            x2="498"
            y2="250"
          >
            <stop offset="0%" stopColor="#b87830" />
            <stop offset="50%" stopColor="#d4a050" />
            <stop offset="100%" stopColor="#e8c878" />
          </linearGradient>
          <linearGradient
            id="xp-s-grad-2"
            gradientUnits="userSpaceOnUse"
            x1="498"
            y1="200"
            x2="0"
            y2="200"
          >
            <stop offset="0%" stopColor="#b87830" />
            <stop offset="50%" stopColor="#d4a050" />
            <stop offset="100%" stopColor="#e8c878" />
          </linearGradient>
          <filter
            id="xp-head-glow"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* S Ribbons */}
        <path
          className="xp-s-ribbon"
          id="xp-s-ribbon-1"
          d="M91.1428 228.914V204.543C91.143 180.11 91.1428 161.183 128.047 148.347L249.737 94.8833L497.969 203.947V373.937L249.737 496.54L0.00012207 390.142V342.802L242.318 445.554C246.9 447.57 252.13 447.497 256.654 445.355L444.272 356.548C450.318 353.686 454.174 347.588 454.174 340.889V244.75C454.174 237.898 450.143 231.689 443.89 228.914L256.65 145.814C252.246 143.86 247.229 143.835 242.807 145.745L165.964 178.929C142.169 188.8 134.937 197.628 134.937 204.543V247L91.1428 228.914Z"
          stroke="url(#xp-s-grad-1)"
        />
        <path
          className="xp-s-ribbon"
          id="xp-s-ribbon-2"
          d="M406.826 267.626V291.997C406.826 316.43 406.826 335.357 369.922 348.193L248.232 401.656L8.82149e-06 292.592V122.603L248.232 -0.000107382L497.969 106.398V153.737L255.651 50.9859C251.068 48.9698 245.839 49.0425 241.314 51.1843L53.6962 139.992C47.6505 142.853 43.7943 148.952 43.7943 155.651V251.79C43.7944 258.642 47.826 264.85 54.0788 267.626L241.319 350.725C245.722 352.68 250.739 352.705 255.162 350.795L332.005 317.611C355.799 307.74 363.031 298.911 363.032 291.997V249.539L406.826 267.626Z"
          stroke="url(#xp-s-grad-2)"
        />
        <circle
          className="xp-s-head"
          id="xp-s-head-1"
          r="4"
          fill="#f0d888"
          filter="url(#xp-head-glow)"
          opacity="0"
        />
        <circle
          className="xp-s-head"
          id="xp-s-head-2"
          r="4"
          fill="#f0d888"
          filter="url(#xp-head-glow)"
          opacity="0"
        />

        {/* Cube top face */}
        <path
          className="xp-cube"
          d="M246.801 193.676C248.18 193.011 249.788 193.014 251.164 193.685L316.447 225.498C318.166 226.336 319.257 228.081 319.257 229.993V256.588C319.257 258.485 318.182 260.219 316.483 261.064L251.2 293.54C249.804 294.235 248.163 294.238 246.764 293.549L180.79 261.059C179.081 260.218 177.999 258.478 177.999 256.574V230.007C177.999 228.087 179.098 226.337 180.826 225.503L246.801 193.676Z"
          fill="#FFF8EE"
        />

        {/* Cube left face */}
        <path
          className="xp-cube-dark"
          d="M248.404 259.645C248.759 259.809 248.986 260.163 248.986 260.554V293.267C248.986 294.007 248.211 294.491 247.546 294.165L178.188 260.187C177.845 260.02 177.628 259.671 177.628 259.289V228.656C177.628 227.927 178.383 227.443 179.046 227.748L248.404 259.645Z"
          fill="#525252"
        />

        {/* Cube right face */}
        <path
          className="xp-cube-dark"
          d="M248.628 259.913V294.871L319.486 259.73C319.486 259.73 319.486 239.414 319.486 226.913C304.628 231.914 248.628 259.913 248.628 259.913Z"
          fill="#525252"
        />

        {/* Shockwave rings */}
        <circle className="xp-shockwave" cx="249" cy="243" r="60" />
        <circle className="xp-shockwave-soft" cx="249" cy="243" r="60" />

        {/* Light beam */}
        <g
          className="xp-light-beam"
          style={{ transformOrigin: "249px 225px" }}
        >
          <polygon
            filter="url(#xp-beam-blur)"
            points="180,225 249,193 319,225 300,-200 198,-200"
            fill="url(#xp-beam-grad)"
          />
          <polygon
            points="180,225 249,193 319,225 300,-200 198,-200"
            fill="url(#xp-beam-grad)"
            opacity="0.6"
          />
        </g>
      </svg>

      {/* Surface shadow */}
      <div className="xp-surface-shadow" />

      {/* Mini floating cubes */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="xp-mini-cube">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L18 7V13L10 18L2 13V7L10 2Z"
              fill="#FFF8EE"
              opacity="0.8"
            />
            <path
              d="M10 11V18L2 13V7L10 11Z"
              fill="#525252"
              opacity="0.6"
            />
            <path
              d="M10 11V18L18 13V7L10 11Z"
              fill="#525252"
              opacity="0.4"
            />
          </svg>
        </div>
      ))}
    </div>
  )
}

export default XpAnimation
