import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   VERTEX SHADER
   – Multi-octave simplex noise displaces sphere vertices
   – Passes displaced world position to fragment for accurate normals
═══════════════════════════════════════════════════════════════ */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistort;

  varying vec3 vWorldPos;
  varying vec3 vSphereNormal;   // original sphere normal
  varying float vDisp;          // scalar displacement (for color variation)

  // ── Simplex 3-D noise (Gustavson / Ashima) ──────────────────
  vec3  mod289v3(vec3  x){return x - floor(x*(1./289.))*289.;}
  vec4  mod289v4(vec4  x){return x - floor(x*(1./289.))*289.;}
  vec4  permute(vec4  x){return mod289v4(((x*34.)+10.)*x);}
  vec4  tsqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1./6., 1./3.);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - 0.5;
    i = mod289v3(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0., i1.z, i2.z, 1.))
      + i.y + vec4(0., i1.y, i2.y, 1.))
      + i.x + vec4(0., i1.x, i2.x, 1.));
    vec3  ns  = (1./7.) * vec3(2,-1,-1) * 0.5 - vec3(0, 0.5, -0.5) * vec3(-1,1,-1);
    vec4  j   = p - 49.*floor(p*(1./49.));
    vec4  x_  = floor(j*(1./7.));
    vec4  y_  = floor(j - 7.*x_);
    vec4  xx  = x_*(1./7.) + ns.yyyy;
    vec4  yy  = y_*(1./7.) + ns.yyyy;
    vec4  hh  = 1. - abs(xx) - abs(yy);
    vec4  b0  = vec4(xx.xy, yy.xy);
    vec4  b1  = vec4(xx.zw, yy.zw);
    vec4  s0  = floor(b0)*2. + 1.;
    vec4  s1  = floor(b1)*2. + 1.;
    vec4  sh  = -step(hh, vec4(0.));
    vec4  a0  = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4  a1  = b1.xzyw + s1.xzyw*sh.zzww;
    vec3  p0  = vec3(a0.xy, hh.x);
    vec3  p1  = vec3(a0.zw, hh.y);
    vec3  p2  = vec3(a1.xy, hh.z);
    vec3  p3  = vec3(a1.zw, hh.w);
    vec4  nm  = tsqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=nm.x; p1*=nm.y; p2*=nm.z; p3*=nm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.);
    m = m*m;
    return 42.*dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  // ────────────────────────────────────────────────────────────

  void main(){
    vSphereNormal = normalize(normalMatrix * normal);

    // 2 octaves of LOW-FREQUENCY noise → large, smooth organic swells
    // Lower position scale = bigger wavelength = rounder bumps
    vec3  p  = position * 0.85;
    float t  = uTime * 0.14;

    float n  = snoise(p           + t)           * 1.000
             + snoise(p * 2.0 + t * 1.1 + 1.7)  * 0.500;
    n /= 1.5; // normalise

    vDisp = n;

    vec3 displaced = position + normal * n * uDistort;

    // Pass the *actual displaced* world position so the fragment shader
    // can derive true surface normals via screen-space derivatives.
    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   FRAGMENT SHADER
   – Reconstructs surface normal from dFdx/dFdy of world pos
   – Fresnel drives iridescent palette: navy→blue→purple→cyan→pink→white
═══════════════════════════════════════════════════════════════ */
const fragmentShader = /* glsl */ `
  varying vec3  vWorldPos;
  varying vec3  vSphereNormal;
  varying float vDisp;

  uniform vec3 uCameraPos;

  // ── Iridescent colour ramp ───────────────────────────────────
  // Matches the reference: very dark navy in concavities → blue →
  // violet → cyan → hot-pink → white-yellow at glancing edges.
  vec3 iridPalette(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 col;
    if(t < 0.18){
      col = mix(vec3(0.005,0.005,0.10), vec3(0.05,0.08,0.72), t/0.18);
    } else if(t < 0.36){
      col = mix(vec3(0.05,0.08,0.72),  vec3(0.52,0.04,0.90), (t-0.18)/0.18);
    } else if(t < 0.55){
      col = mix(vec3(0.52,0.04,0.90),  vec3(0.02,0.80,0.95), (t-0.36)/0.19);
    } else if(t < 0.74){
      col = mix(vec3(0.02,0.80,0.95),  vec3(0.96,0.10,0.82), (t-0.55)/0.19);
    } else {
      col = mix(vec3(0.96,0.10,0.82),  vec3(1.00,0.98,0.65), (t-0.74)/0.26);
    }
    return col;
  }

  void main(){
    // Reconstruct the true displaced surface normal from geometry derivatives
    vec3 dX = dFdx(vWorldPos);
    vec3 dY = dFdy(vWorldPos);
    vec3 N  = normalize(cross(dX, dY));

    // View direction
    vec3 V = normalize(uCameraPos - vWorldPos);

    float NdotV = clamp(dot(N, V), 0.0, 1.0);

    // ── Fresnel term — gentler exponent so colour fills the whole surface
    float fresnel = pow(1.0 - NdotV, 1.6);

    // ── Displacement shifts the colour laterally across smooth swells
    //    (smaller coefficient = wider, softer colour zones)
    float dispShift = vDisp * 0.28;

    // ── Sample palette
    //    fresnel * 0.75 keeps the palette away from the extremes → stays
    //    in the vivid blue-purple-cyan-pink mid-range across most of the blob.
    float t      = clamp(fresnel * 0.75 + dispShift * 0.5 + 0.12, 0.0, 1.0);
    vec3  iriCol = iridPalette(t);

    // ── No dark base — the smooth reference is fully saturated everywhere.
    //    We use a deep-blue minimum so even facing-camera areas glow.
    vec3 base = vec3(0.04, 0.04, 0.35);
    vec3 color = mix(base, iriCol, pow(fresnel, 0.5) * 1.6 + 0.25);

    // ── Subtle bright rim (white edge glint, less aggressive)
    color += vec3(0.75, 0.88, 1.0) * pow(fresnel, 5.0) * 1.2;

    // ── Gentle gamma
    color = pow(max(color, 0.0), vec3(0.90));

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   React component
═══════════════════════════════════════════════════════════════ */
const IDLE_DISTORT  = 0.28;   // smooth swell, not spiky
const HOVER_DISTORT = 0.42;   // gentle increase on hover
const LERP          = 2.0;

function IridescentMesh({ hovered }) {
  const meshRef    = useRef(null);
  const matRef     = useRef(null);
  const distortRef = useRef(IDLE_DISTORT);

  // Build the ShaderMaterial once
  const uniforms = useRef({
    uTime:      { value: 0 },
    uDistort:   { value: IDLE_DISTORT },
    uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
  });

  useFrame(({ clock, camera }) => {
    if (!matRef.current) return;

    distortRef.current = THREE.MathUtils.lerp(
      distortRef.current,
      hovered ? HOVER_DISTORT : IDLE_DISTORT,
      LERP / 60, // frame-rate-independent lerp at ~60 fps baseline
    );

    uniforms.current.uTime.value    = clock.getElapsedTime();
    uniforms.current.uDistort.value = distortRef.current;
    uniforms.current.uCameraPos.value.copy(camera.position);

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x  = Math.sin(clock.getElapsedTime() * 0.28) * 0.12;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/*
        High-poly sphere: radius 0.95, 256×256 segments for smooth noise.
        At max distort 0.92 the surface extends ≈ 0.95×(1+0.92) ≈ 1.82 units —
        well inside the camera frustum (camera z=5.5, fov=44).
      */}
      <sphereGeometry args={[0.95, 256, 256]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        side={THREE.FrontSide}
        extensions={{ derivatives: true }}   // enables dFdx/dFdy
      />
    </mesh>
  );
}

export default function HolographicBlob() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="w-full h-full cursor-pointer select-none"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{ minHeight: 380 }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 44, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias:           true,
          alpha:               true,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        style={{ background: 'transparent' }}
      >
        <Stars radius={28} depth={15} count={650} factor={1.3} fade speed={0.35} />
        <IridescentMesh hovered={hovered} />
      </Canvas>
    </div>
  );
}
