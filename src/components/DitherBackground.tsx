import * as THREE from "three";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { shaderMaterial, Effects } from "@react-three/drei";
import { EffectComposer } from "postprocessing";
import { useRef } from "react";

// ----------------------------
// Wave Shader
// ----------------------------
const waveVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waveFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;

  // Simple noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv * 3.0;

    float t = uTime * 0.25;
    float n = noise(uv + vec2(t, t * 0.5));

    float wave = sin(uv.x * 6.0 + n * 1.5 + t * 2.0);
    float color = smoothstep(0.1, 0.9, wave * 0.5 + 0.5);

    gl_FragColor = vec4(vec3(color), 1.0);
  }
`;

const WaveMaterial = shaderMaterial(
  { uTime: 0, uMouse: new THREE.Vector2(), uResolution: new THREE.Vector2() },
  waveVertexShader,
  waveFragmentShader,
);

extend({ WaveMaterial });

// ----------------------------
// Dither Shader
// ----------------------------
const ditherFragmentShader = `
  uniform sampler2D tDiffuse;
  varying vec2 vUv;

  float bayer8x8[64] = float[64](
     0.0, 48.0, 12.0, 60.0,  3.0, 51.0, 15.0, 63.0,
    32.0, 16.0, 44.0, 28.0, 35.0, 19.0, 47.0, 31.0,
     8.0, 56.0,  4.0, 52.0, 11.0, 59.0,  7.0, 55.0,
    40.0, 24.0, 36.0, 20.0, 43.0, 27.0, 39.0, 23.0,
     2.0, 50.0, 14.0, 62.0,  1.0, 49.0, 13.0, 61.0,
    34.0, 18.0, 46.0, 30.0, 33.0, 17.0, 45.0, 29.0,
    10.0, 58.0,  6.0, 54.0,  9.0, 57.0,  5.0, 53.0,
    42.0, 26.0, 38.0, 22.0, 41.0, 25.0, 37.0, 21.0
  );

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    ivec2 uv8 = ivec2(mod(gl_FragCoord.xy, 8.0));
    float threshold = bayer8x8[uv8.y * 8 + uv8.x] / 64.0;
    float gray = (color.r + color.g + color.b) / 3.0;
    float d = gray < threshold ? 0.0 : 1.0;
    gl_FragColor = vec4(vec3(d), 1.0);
  }
`;

// ----------------------------
// Wave Mesh
// ----------------------------
function Waves() {
  const ref = useRef();

  useFrame(({ clock, viewport, pointer }) => {
    ref.current.uTime = clock.getElapsedTime();
    ref.current.uMouse.set(pointer.x, pointer.y);
    ref.current.uResolution.set(viewport.width, viewport.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <waveMaterial ref={ref} />
    </mesh>
  );
}

// ----------------------------
// Post Processing
// ----------------------------
function DitherEffect() {
  return (
    <Effects>
      <EffectComposer>
        <shaderPass args={[{ fragmentShader: ditherFragmentShader }]} />
      </EffectComposer>
    </Effects>
  );
}

// ----------------------------
// Background Component
// ----------------------------
export default function DitherBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <Canvas gl={{ antialias: false }} dpr={1} camera={{ position: [0, 0, 1] }}>
        <Waves />
        <DitherEffect />
      </Canvas>
    </div>
  );
}
