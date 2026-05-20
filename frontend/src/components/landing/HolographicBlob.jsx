import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   VERTEX SHADER
═══════════════════════════════════════════════════════════════ */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistort;
  uniform float uSpeed;

  varying vec3  vWorldPos;
  varying float vDisp;

  vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289v4(((x*34.)+10.)*x);}
  vec4 tsqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-0.5;
    i=mod289v3(i);
    vec4 p=permute(permute(permute(
        i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    vec3 ns=(1./7.)*vec3(2.,-1.,-1.)*0.5-vec3(0.,.5,-.5)*vec3(-1.,1.,-1.);
    vec4 j=p-49.*floor(p*(1./49.));
    vec4 x_=floor(j*(1./7.));vec4 y_=floor(j-7.*x_);
    vec4 xx=x_*(1./7.)+ns.yyyy;vec4 yy=y_*(1./7.)+ns.yyyy;
    vec4 hh=1.-abs(xx)-abs(yy);
    vec4 b0=vec4(xx.xy,yy.xy);vec4 b1=vec4(xx.zw,yy.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(hh,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,hh.x);vec3 p1=vec3(a0.zw,hh.y);
    vec3 p2=vec3(a1.xy,hh.z);vec3 p3=vec3(a1.zw,hh.w);
    vec4 nm=tsqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vec3  p = position * 0.85;
    float t = uTime * uSpeed * 0.07;
    float n = snoise(p + t)                    * 1.000
            + snoise(p * 2.0 + t * 1.1 + 1.7) * 0.500;
    n /= 1.5;
    
    vDisp = n;
    
    // Displace along the vertex normal
    vec3 displaced = position + normal * n * uDistort;
    
    vWorldPos   = (modelMatrix * vec4(displaced, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   FRAGMENT SHADER
═══════════════════════════════════════════════════════════════ */
const fragmentShader = /* glsl */ `
  varying vec3  vWorldPos;
  varying float vDisp;
  uniform vec3  uCameraPos;
  uniform float uHueShift;

  vec3 iridPalette(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 col;
    if(t < 0.18)      col = mix(vec3(0.005,0.005,0.10),vec3(0.05,0.08,0.72),  t/0.18);
    else if(t < 0.36) col = mix(vec3(0.05,0.08,0.72), vec3(0.52,0.04,0.90),   (t-0.18)/0.18);
    else if(t < 0.55) col = mix(vec3(0.52,0.04,0.90), vec3(0.02,0.80,0.95),   (t-0.36)/0.19);
    else if(t < 0.74) col = mix(vec3(0.02,0.80,0.95), vec3(0.96,0.10,0.82),   (t-0.55)/0.19);
    else               col = mix(vec3(0.96,0.10,0.82), vec3(1.00,0.98,0.65),   (t-0.74)/0.26);
    return col;
  }

  void main(){
    vec3 dX = dFdx(vWorldPos);
    vec3 dY = dFdy(vWorldPos);
    vec3 N  = normalize(cross(dX, dY));
    vec3 V  = normalize(uCameraPos - vWorldPos);
    float NdotV  = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 1.6);
    float t = clamp(fresnel * 0.75 + vDisp * 0.14 + 0.12 + uHueShift * 0.38, 0.0, 1.0);
    vec3 iriCol = iridPalette(t);
    iriCol = mix(iriCol, pow(iriCol, vec3(0.75)), abs(uHueShift) * 0.8);
    vec3 base  = vec3(0.04, 0.04, 0.35);
    vec3 color = mix(base, iriCol, pow(fresnel, 0.5) * 1.6 + 0.25);
    color += vec3(0.75, 0.88, 1.0) * pow(fresnel, 5.0) * (1.2 + abs(uHueShift) * 0.8);
    color  = pow(max(color, 0.0), vec3(0.90));
    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   Mesh — events live on the <mesh> so R3F raycasting detects them
═══════════════════════════════════════════════════════════════ */
function IridescentMesh() {
  const meshRef = useRef(null);
  const matRef  = useRef(null);

  // Interaction state in plain refs
  const isHovered    = useRef(false);
  const clickBurst   = useRef(0);
  
  // Smoothly animated current values
  const cur = useRef({ distort: 0.4, speed: 0.20, hue: 0.0 });

  // Initial uniforms object
  const uniforms = useRef({
    uTime:      { value: 0 },
    uDistort:   { value: 0.4 },
    uSpeed:     { value: 0.20 },
    uHueShift:  { value: 0.0 },
    uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
  });

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return;

    const hov = isHovered.current;

    // Decay click burst
    if (clickBurst.current > 0) {
      clickBurst.current = Math.max(0, clickBurst.current - delta * 4);
    }

    // Targets
    const tDistort = (hov ? 0.75 : 0.40) + clickBurst.current * 0.5;
    const tSpeed   =  hov ? 0.60 : 0.20;
    const tHue     =  hov ? 0.30 : 0.0;

    // Lerp
    const k = delta * 4;
    cur.current.distort = THREE.MathUtils.lerp(cur.current.distort, tDistort, k);
    cur.current.speed   = THREE.MathUtils.lerp(cur.current.speed,   tSpeed,   k);
    cur.current.hue     = THREE.MathUtils.lerp(cur.current.hue,     tHue,     k);

    // Write DIRECTLY into the material's uniforms (100% bulletproof)
    const u = matRef.current.uniforms;
    u.uTime.value     = state.clock.getElapsedTime();
    u.uDistort.value  = cur.current.distort;
    u.uSpeed.value    = cur.current.speed;
    u.uHueShift.value = cur.current.hue;
    u.uCameraPos.value.copy(state.camera.position);

    // Slow auto-rotation
    meshRef.current.rotation.y += delta * 0.22;
    meshRef.current.rotation.x  = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.10;
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => { isHovered.current = true; document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => {  isHovered.current = false; document.body.style.cursor = 'auto'; }}
      onClick={() => {       clickBurst.current = 1.0; }}
    >
      <sphereGeometry args={[1.15, 256, 256]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        side={THREE.FrontSide}
        extensions={{ derivatives: true }}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Canvas
═══════════════════════════════════════════════════════════════ */
export default function HolographicBlob() {
  return (
    <div className="w-full h-full select-none" style={{ minHeight: 380, cursor: 'pointer' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 100 }}
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
        <IridescentMesh />
      </Canvas>
    </div>
  );
}
