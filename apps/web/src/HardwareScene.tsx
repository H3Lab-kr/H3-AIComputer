import { t } from './i18n'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GoldBadge } from './ProductModels'

function Label({
  text,
  position,
  rotation = [0, 0, 0],
  width = 1,
}: {
  text: string
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
}) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 128
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = '#b9cee9'
    ctx.font = '600 40px Paperozi'
    ctx.textAlign = 'center'
    ctx.fillText(text, 256, 88)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [text])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, width / 4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}
function Block({
  at,
  size,
  color = '#252c35',
  metal = 0.7,
  rough = 0.3,
}: {
  at: [number, number, number]
  size: [number, number, number]
  color?: string
  metal?: number
  rough?: number
}) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(...size) * 0.12}
      smoothness={2}
      position={at}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </RoundedBox>
  )
}
function Fan({
  at,
  radius = 0.42,
  spin,
}: {
  at: [number, number, number]
  radius?: number
  spin: boolean
}) {
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (spin && blades.current) blades.current.rotation.z += Math.min(dt, 0.04) * 0.8
  })
  return (
    <group position={at}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.025, 8, 40]} />
        <meshStandardMaterial color="#5a6b82" metalness={0.8} roughness={0.35} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <group ref={blades}>
          {Array.from({ length: 9 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 9]}>
              <mesh position={[radius * 0.47, 0, 0]} rotation={[0, 0, 0.55]}>
                <boxGeometry args={[radius * 0.84, radius * 0.23, 0.035]} />
                <meshStandardMaterial color="#303944" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
        <mesh>
          <cylinderGeometry args={[radius * 0.24, radius * 0.24, 0.08, 20]} />
          <meshStandardMaterial color="#97a5b7" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <mesh>
        <cylinderGeometry args={[radius * 0.15, radius * 0.15, 0.11, 20]} />
        <meshStandardMaterial color="#14171c" />
      </mesh>
    </group>
  )
}
function GPU({
  at,
  spin,
  primary = false,
}: {
  at: [number, number, number]
  spin: boolean
  primary?: boolean
}) {
  return (
    <group position={at}>
      <Block at={[0, 0, 0]} size={[2.05, 0.18, 1.3]} color="#181e25" />
      <Block at={[0, 0.11, 0]} size={[2.1, 0.14, 1.34]} color="#56667b" metal={0.9} />
      {[-0.53, 0.53].map((x) => (
        <Fan key={x} at={[x, 0.21, 0]} radius={0.43} spin={spin} />
      ))}
      <Block at={[0, -0.11, 0.67]} size={[1.88, 0.12, 0.045]} color="#739acc" metal={0.1} />
      {Array.from({ length: 15 }, (_, i) => (
        <Block
          key={i}
          at={[-0.87 + i * 0.124, -0.025, 0.7]}
          size={[0.025, 0.13, 0.08]}
          color="#788aa1"
        />
      ))}
      {primary && <GoldBadge position={[0.6, 0.04, 0.748]} scale={0.32} />}
    </group>
  )
}
function Cable({
  points,
  color = '#243449',
  radius = 0.045,
}: {
  points: [number, number, number][]
  color?: string
  radius?: number
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  )
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, radius, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.42} />
    </mesh>
  )
}
function Screw({ at }: { at: [number, number, number] }) {
  return (
    <group position={at}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.022, 12]} />
        <meshStandardMaterial color="#8797ad" metalness={0.9} roughness={0.22} />
      </mesh>
      <Block at={[0, 0, 0.015]} size={[0.044, 0.009, 0.005]} color="#101725" />
    </group>
  )
}
function EngineeringDetails() {
  return (
    <group>
      {/* Densely populated mainboard, M.2 modules and PCIe contacts. */}
      {Array.from({ length: 18 }, (_, i) => (
        <group key={i} position={[-1.085, -0.8 + (i % 6) * 0.36, -0.85 + Math.floor(i / 6) * 0.53]}>
          <Block at={[0, 0, 0]} size={[0.07, 0.16, 0.22]} color="#172136" />
          {[0, 1, 2].map((j) => (
            <Block
              key={j}
              at={[0.045, -0.045 + j * 0.045, 0]}
              size={[0.01, 0.013, 0.24]}
              color="#9aa9bd"
            />
          ))}
        </group>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-0.99, 1.43, -0.82 + i * 0.18]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 12]} />
          <meshStandardMaterial color="#c4ccd7" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Radiator fins and suspended cooling assembly. */}
      <Block at={[0, 1.48, -0.15]} size={[2.16, 0.18, 1.85]} color="#152035" />
      {Array.from({ length: 24 }, (_, i) => (
        <Block
          key={i}
          at={[-1 + i * 0.087, 1.58, -0.15]}
          size={[0.022, 0.07, 1.7]}
          color="#5a6a80"
        />
      ))}
      <Fan at={[-0.54, 1.62, -0.15]} radius={0.44} spin={false} />
      <Fan at={[0.54, 1.62, -0.15]} radius={0.44} spin={false} />
      {[0, 0.14].map((offset, i) => (
        <Cable
          key={i}
          points={[
            [-0.53, 0.94, -0.45 + offset],
            [0.06, 1.15, -0.65 + offset],
            [0.61, 1.1, -0.46 + offset],
            [0.62, 1.48, -0.35 + offset],
          ]}
          color="#202c41"
          radius={0.065}
        />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Cable
          key={i}
          points={[
            [0.94, -0.18, 0.15 + i * 0.05],
            [1.1, -0.4, 0.3 + i * 0.05],
            [0.95, -1.15, 0.1 + i * 0.05],
            [0.43, -1.3, 0.17 + i * 0.05],
          ]}
          color={i === 2 ? '#668aaa' : '#182338'}
          radius={0.026}
        />
      ))}
      <Block at={[0.64, -1.44, 0.65]} size={[0.68, 0.3, 0.09]} color="#0b1323" />
      <Label text="MODULAR POWER" position={[0.2, -1.4, 0.72]} width={1.5} />
      {[-1.14, 1.14].flatMap((x) =>
        [-1.65, 1.63].map((y) => <Screw key={`${x}${y}`} at={[x, y, 1.345]} />),
      )}
    </group>
  )
}
/* 좁은 화면에서는 전개 폭을 줄이고 카메라를 뒤로 뺀다.
   three 의 fov 는 세로 기준이라, 세로로 긴 화면에서는 가로 화각이 좁아져
   가로로 퍼진 모델의 좌우가 잘린다. 화각이 아니라 거리로 해결한다. */
export function useCompactScene() {
  const query = '(max-width: 800px)'
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const m = window.matchMedia(query)
    const change = () => setCompact(m.matches)
    m.addEventListener('change', change)
    return () => m.removeEventListener('change', change)
  }, [])
  return compact
}

export function Workstation({
  exploded,
  reduced,
  paused,
  explosion,
  spread = 1,
}: {
  exploded: boolean
  reduced: boolean
  paused: boolean
  explosion?: number
  spread?: number
}) {
  const roof = useRef<THREE.Group>(null),
    side = useRef<THREE.Group>(null),
    front = useRef<THREE.Group>(null),
    gpu = useRef<THREE.Group>(null),
    root = useRef<THREE.Group>(null)
  useFrame((state, dt) => {
    const e = (explosion ?? (exploded ? 1 : 0)) * spread
    const ease = reduced || paused ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 5)
    if (roof.current)
      roof.current.position.y = THREE.MathUtils.lerp(roof.current.position.y, e * 1.2, ease)
    if (side.current)
      side.current.position.x = THREE.MathUtils.lerp(side.current.position.x, e * 1.7, ease)
    if (front.current)
      front.current.position.z = THREE.MathUtils.lerp(front.current.position.z, e * 1.9, ease)
    if (gpu.current)
      gpu.current.position.x = THREE.MathUtils.lerp(gpu.current.position.x, e * 0.9, ease)
    if (root.current && !reduced && !paused)
      root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.075
  })
  const spin = !reduced && !paused
  return (
    <group ref={root} position={[0, -0.1, 0]} scale={0.88}>
      <EngineeringDetails />
      <Block at={[0, -1.8, 0]} size={[2.7, 0.18, 2.5]} color="#96a4b6" />
      <Block at={[-1.26, 0, 0]} size={[0.13, 3.6, 2.44]} color="#657992" />
      <Block at={[0, 0, -1.18]} size={[2.55, 3.6, 0.1]} color="#303944" />
      {[-1.28, 1.28].flatMap((x) =>
        [-1.2, 1.2].map((z) => (
          <Block key={`${x}-${z}`} at={[x, 0, z]} size={[0.105, 3.68, 0.105]} color="#9ca9bb" />
        )),
      )}
      {[-0.99, 0.99].flatMap((x) =>
        [-0.88, 0.88].map((z) => (
          <Block key={`${x}-${z}`} at={[x, -1.99, z]} size={[0.31, 0.24, 0.42]} color="#212830" />
        )),
      )}
      <Block
        at={[-1.15, 0.21, -0.07]}
        size={[0.08, 2.67, 1.94]}
        color="#152234"
        metal={0.2}
        rough={0.65}
      />
      <Block at={[-0.89, 0.82, -0.19]} size={[0.45, 0.9, 0.86]} color="#5e7087" />
      {Array.from({ length: 12 }, (_, i) => (
        <Block
          key={i}
          at={[-0.58, 0.47 + i * 0.064, -0.19]}
          size={[0.23, 0.027, 0.89]}
          color="#a6b2c1"
        />
      ))}
      <Label
        text="CPU"
        position={[-0.448, 0.86, -0.19]}
        rotation={[0, Math.PI / 2, 0]}
        width={0.55}
      />
      {Array.from({ length: 4 }, (_, i) => (
        <Block
          key={i}
          at={[-1.04, 0.5, 0.47 + i * 0.13]}
          size={[0.25, 1.6, 0.058]}
          color={i % 2 ? '#92a2b7' : '#1b2026'}
        />
      ))}
      <Block at={[-0.34, -1.3, -0.19]} size={[1.63, 0.7, 1.57]} color="#222830" />

      <group ref={gpu}>
        <GPU at={[0.02, -0.27, 0.05]} spin={spin} primary />
        <GPU at={[0.02, -0.83, 0.05]} spin={spin} />
      </group>
      <group ref={roof}>
        <Block at={[0, 1.86, 0]} size={[2.7, 0.15, 2.5]} color="#96a4b6" metal={0.88} />
        {Array.from({ length: 12 }, (_, i) => (
          <Block
            key={i}
            at={[-1.1 + i * 0.2, 1.946, -0.04]}
            size={[0.065, 0.009, 1.94]}
            color="#323b47"
          />
        ))}
      </group>
      <group ref={front}>
        <Block
          at={[0, 0, 1.24]}
          size={[2.53, 3.62, 0.14]}
          color="#111e34"
          metal={0.8}
          rough={0.27}
        />
        <Block at={[0, -0.24, 1.323]} size={[2.18, 2.56, 0.026]} color="#080f1d" />
        {Array.from({ length: 34 }, (_, i) => (
          <Block
            key={i}
            at={[-1.06 + i * 0.064, -0.24, 1.35]}
            size={[0.026, 2.54, 0.045]}
            color={i % 3 === 0 ? '#596a82' : '#2a3a53'}
            metal={0.85}
            rough={0.25}
          />
        ))}
        {[-1.22, 1.22].map((x) => (
          <Block
            key={x}
            at={[x, 0, 1.333]}
            size={[0.025, 3.49, 0.027]}
            color="#a9b7ca"
            metal={0.9}
          />
        ))}
        <GoldBadge position={[0, 1.4, 1.35]} scale={0.95} />
        <Block at={[0, -1.62, 1.338]} size={[1.88, 0.018, 0.02]} color="#72b8ff" metal={0} />
        <Label text="H3 PRECISION" position={[0, -1.73, 1.36]} width={1.52} />
        <mesh position={[0.95, 1.44, 1.35]}>
          <ringGeometry args={[0.05, 0.064, 32]} />
          <meshBasicMaterial color="#99caff" />
        </mesh>
        {[-0.22, 0.08].map((x) => (
          <Block key={x} at={[x, 1.12, 1.345]} size={[0.16, 0.045, 0.025]} color="#050b14" />
        ))}
      </group>
      <group ref={side}>
        <mesh position={[1.29, 0, 0]} castShadow>
          <boxGeometry args={[0.035, 3.49, 2.31]} />
          <meshPhysicalMaterial
            color="#809aba"
            metalness={0.15}
            roughness={0.08}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
        {[-1.75, 1.75].map((y) => (
          <Block key={y} at={[1.32, y, 0]} size={[0.065, 0.07, 2.34]} color="#8794a8" />
        ))}
        {[-1.13, 1.13].map((z) => (
          <Block key={z} at={[1.32, 0, z]} size={[0.065, 3.49, 0.07]} color="#8794a8" />
        ))}
        <Block at={[1.32, -1.52, 0]} size={[0.07, 0.32, 2.34]} color="#61738b" />
      </group>
    </group>
  )
}
export default function HardwareScene({
  exploded,
  reduced,
  paused,
  active = true,
}: {
  exploded: boolean
  reduced: boolean
  paused: boolean
  active?: boolean
}) {
  const compact = useCompactScene()
  return (
    <Canvas
      aria-label={t('H3 컴퓨터 내부 설계 3D 컨셉')}
      camera={{ position: compact ? [7.3, 3.9, 8.2] : [6.5, 3.5, 7.3], fov: 34 }}
      dpr={[1, 1.5]}
      shadows
      frameloop={!active ? 'never' : reduced || paused ? 'demand' : 'always'}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={1.25} />
      <hemisphereLight intensity={1.2} color="#f5f7ff" groundColor="#111419" />
      <directionalLight
        position={[1, 6, 4]}
        intensity={4}
        color="#f4f3df"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 2, -3]} intensity={3} color="#f0f5ff" />
      <directionalLight position={[5, 1, -2]} intensity={2.5} color="#cad8eb" />
      <Suspense fallback={null}>
        <Workstation
          exploded={exploded}
          reduced={reduced}
          paused={paused}
          spread={compact ? 0.62 : 1}
        />
        <ContactShadows
          position={[0, -1.96, 0]}
          opacity={0.42}
          scale={13}
          blur={2.7}
          far={5}
          resolution={256}
          frames={1}
        />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3.6}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-0.1}
        maxAzimuthAngle={1.3}
        target={[exploded ? (compact ? 0.15 : 0.45) : 0, 0.12, 0]}
      />
    </Canvas>
  )
}
