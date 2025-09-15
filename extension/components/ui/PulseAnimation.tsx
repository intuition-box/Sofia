import React, { useRef, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'

interface PulseAnimationProps {
  size?: number
}

const PulseAnimation = ({ size = 150 }: PulseAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blurCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const { navigateTo } = useRouter()

  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `

  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 v_uv;

    vec3 hue(vec3 col, float hue) {
      vec3 k = vec3(0.577);
      vec3 crossProduct = vec3(
        k.y * col.z - k.z * col.y,
        k.z * col.x - k.x * col.z, 
        k.x * col.y - k.y * col.x
      );
      return mix(vec3(dot(vec3(0.333), col)), col, cos(hue)) 
             + crossProduct * sin(hue);
    }

    float hash12(vec2 p) {
      vec3 p3 = abs(fract(p.xyx / 0.1031));
      p3 += dot(p3, p3.yzx + 40.33);
      return abs(fract((p3.x + p3.y) * p3.z));
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = p - i;
      f *= f * (3.5 - 2.5 * f);
      float res = mix(
        mix(hash12(i), hash12(i + vec2(1, 0)), f.x),
        mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1)), f.x), f.y
      );
      return res;	
    }

    void main() {
      vec2 fragCoord = v_uv * u_resolution;
      vec2 uv = (fragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

      float R = 0.7;
      float l = length(uv);
      float f = 0.01;
      float t = u_time * 0.3;

      float n1 = noise(uv * 0.0 + t) * 0.7 + noise(uv * 3.0 - t) * 0.3;
      float n2 = noise(uv * 1.5 + 3.19 - t) * 0.7 + noise(uv * 3.0 - 9.61 + t) * 0.3;

      vec3 rc = vec3(0);
      float w = 0.03;
      float d = abs(l - 1.17 * R);
      float r = min(1.0, w / sqrt(d) * 3.0);

      vec3 c1 = vec3(0, r*r*n2*n1, r);
      c1 = max(hue(c1, -sin(cos(uv.y * 3.0 + t * 8.0) 
                 + uv.x * 2.0 + t * 5.0) * 0.4), 0.0);
      rc += c1 * c1;

      // Multiple ring layers
      float d2 = l - R + (n2 - R) * 0.1;
      float d3 = abs(d2);
      w = 0.09 * pow(abs(n1 - 0.1), 0.7);
      float g = mix(smoothstep(-w, w, d2), smoothstep(w, -w, d2), smoothstep(0.1, 0.3, n1));
      float r2 = clamp((w - d3) / f, 0.0, 1.0) * 3.0 * sqrt(g);
      vec2 suv = vec2(smoothstep(0.0, w, d3), abs(atan(uv.y, uv.x) / 1.57));
      float str = smoothstep(0.0, 1.0, noise(suv.xy * vec2(4))) * 0.5 + 0.5;
      float cut = 0.5 + 0.5 * smoothstep(-1.0, 1.0,
                   sin((suv.y + (suv.x + str) * 0.1) * 2.0 - t * 2.0 + n1 - n2));
      r2 *= min(str*str, 0.5 * 0.5 + cut);
      vec3 c2 = vec3(n1 * n2 * 0.5, 0.9 * (1.0 - n1) * (1.0 - n2), 1) / (1.0 - g * 0.5);
      rc = rc * (1.0 - min(r2, 1.0)) + r2 * c2;
      rc += 3.0 * cut * c2 * (1.0 - r2) * pow(smoothstep(0.13, -1.0, d3) / (0.1 + d3), 2.0);

      // Additional layers
      d3 = l - R + (n1 - R + 4.0) * 0.1;
      r2 = smoothstep(0.0, -f, d3);
      c2 = vec3(n1 * n2 * 0.5, 0.9 * (1.0 - n1) * (1.0 - n2), 1);
      c2 = mix(vec3(0.0, 0.0, 0.04 / (0.1 + d3*d3)), c2, smoothstep(0.15, -0.2, d3));
      c2 = c2 * (1.0 + smoothstep(0.1, -0.15, d3));
      rc = rc * (1.0 - min(r2, 1.0)) + r2 * c2;

      float s = max(0.0, l - 0.1);
      rc = mix(rc, rc.bgr, smoothstep(-0.8 - s, 0.8 + s, n1 - n2 - uv.x + uv.y));

      rc = clamp(rc, 0.0, 1.0);
      vec3 c = pow(rc, vec3(0.45));
      
      float alpha = max(max(c.r, c.g), c.b);
      alpha = smoothstep(0.01, 0.1, alpha);
      
      gl_FragColor = vec4(c, alpha);
    }
  `

  const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type)
    if (!shader) return null
    
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    
    return shader
  }

  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null => {
    const program = gl.createProgram()
    if (!program) return null
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return null
    }
    
    return program
  }

  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return null

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    
    if (!vertexShader || !fragmentShader) return null

    const program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) return null

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    canvas.width = size * 4
    canvas.height = size * 4

    return { gl, program, positionAttributeLocation, timeUniformLocation, resolutionUniformLocation, positionBuffer }
  }

  const renderCanvas = (setup: any, time: number, canvas: HTMLCanvasElement) => {
    const { gl, program, positionAttributeLocation, timeUniformLocation, resolutionUniformLocation, positionBuffer } = setup
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.useProgram(program)

    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    gl.uniform1f(timeUniformLocation, time * 0.001)
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const blurCanvas = blurCanvasRef.current
    
    if (!canvas || !blurCanvas) return

    const mainSetup = setupCanvas(canvas)
    const blurSetup = setupCanvas(blurCanvas)
    
    if (!mainSetup || !blurSetup) return

    const render = (time: number) => {
      renderCanvas(mainSetup, time, canvas)
      renderCanvas(blurSetup, time, blurCanvas)
      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [size])

  const handleClick = () => {
    localStorage.setItem('targetTab', 'Pulse')
    navigateTo('Sofia')
  }

  return (
    <div 
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        position: 'relative'
      }}
    >
      {/* Canvas avec blur en arrière-plan */}
      <canvas 
        ref={blurCanvasRef}
        style={{
          position: 'absolute',
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: '50%',
          filter: 'blur(8px)',
          zIndex: -1,
          opacity: 0.6
        }}
      />
      
      {/* Canvas principal net */}
      <canvas 
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          borderRadius: '50%'
        }}
      />
    </div>
  )
}

export default PulseAnimation