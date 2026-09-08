import { t } from './i18n'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  RoundedBox,
  ContactShadows,
  OrbitControls,
  Environment,
  Lightformer,
} from '@react-three/drei'
import * as THREE from 'three'
import { GoldBadge } from './ProductModels'

export function StudioReflections() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer
        position={[3, 4, 3]}
        rotation={[0, -Math.PI / 4, 0]}
        scale={[3, 7, 1]}
        intensity={2.5}
        color="#e4edf5"
      />
      <Lightformer
        position={[-4, 2, -2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[2, 5, 1]}
        intensity={1.5}
        color="#92adc5"
      />
      <Lightformer
        position={[0, 5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[4, 4, 1]}
        intensity={2}
        color="#ffffff"
      />
    </Environment>
  )
}

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
// All fan rotors lie in XZ with a Y axle; rotate the complete assembly for intake/exhaust.
function Fan({
  at,
  radius = 0.42,
  spin,
}: {
  at: [number, number, number]
  radius?: number
  spin: boolean
}) {
  const rotor = useRef<THREE.Group>(null)
  const blade = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0.12, -0.035)
    shape.quadraticCurveTo(0.24, -0.15, 0.39, -0.13)
    shape.quadraticCurveTo(0.43, -0.04, 0.36, 0.08)
    shape.quadraticCurveTo(0.2, 0.06, 0.12, 0.035)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: false, curveSegments: 8 })
  }, [])
  useEffect(() => () => blade.dispose(), [blade])
  useFrame((_, dt) => {
    if (spin && rotor.current) rotor.current.rotation.y += Math.min(dt, 0.04) * 1.8
  })
  return (
    <group position={at} scale={radius / 0.42}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.435, 0.035, 8, 40]} />
        <meshStandardMaterial color="#63717d" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.02, 40]} />
        <meshStandardMaterial color="#080d13" roughness={0.9} />
      </mesh>
      <group ref={rotor}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 7, 0]}>
            <mesh geometry={blade} rotation={[-Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#38434e" metalness={0.35} roughness={0.48} />
            </mesh>
          </group>
        ))}
        <mesh>
          <cylinderGeometry args={[0.115, 0.115, 0.065, 24]} />
          <meshStandardMaterial color="#101820" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      {[-0.44, 0.44].flatMap((x) =>
        [-0.44, 0.44].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0, z]}>
            <cylinderGeometry args={[0.028, 0.028, 0.045, 8]} />
            <meshStandardMaterial color="#8e969e" metalness={0.85} roughness={0.3} />
          </mesh>
        )),
      )}
    </group>
  )
}
function GPU({ spin }: { spin: boolean }) {
  return (
    <group>
      {/* Generic partner-style card. Rear bracket at -Z, intake faces down. */}
      <Block at={[0, 0, 0]} size={[1.1, 0.38, 2.5]} color="#222930" />
      <Block at={[0, 0.21, 0]} size={[1.08, 0.035, 2.46]} color="#77828d" rough={0.38} />
      {Array.from({ length: 8 }, (_, i) => (
        <Block
          key={`backplate-${i}`}
          at={[0.12, 0.232, -0.95 + i * 0.13]}
          size={[0.68, 0.006, 0.025]}
          color="#24303a"
        />
      ))}
      {[-0.44, 0.44].flatMap((x) =>
        [-1.12, 1.12].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.236, z]}>
            <cylinderGeometry args={[0.022, 0.022, 0.009, 8]} />
            <meshStandardMaterial color="#111820" />
          </mesh>
        )),
      )}
      {Array.from({ length: 36 }, (_, i) => (
        <Block
          key={i}
          at={[0, -0.01, -1.16 + i * 0.066]}
          size={[1.13, 0.24, 0.017]}
          color="#a4aeb6"
          rough={0.45}
        />
      ))}
      {[-0.66, 0.3].map((z) => (
        <group key={z} position={[0, -0.24, z]} rotation={[Math.PI, 0, 0]}>
          <Fan at={[0, 0, 0]} radius={0.42} spin={spin} />
        </group>
      ))}
      <Block at={[0, 0, -1.3]} size={[1.16, 0.44, 0.04]} color="#929da8" />
      {[-0.34, 0, 0.34].map((x) => (
        <Block key={x} at={[x, 0, -1.325]} size={[0.2, 0.085, 0.02]} color="#080c10" />
      ))}
      <Block at={[-0.59, 0.12, -0.24]} size={[0.035, 0.18, 1.15]} color="#bf9a55" />
      <Label
        text="H3 / GRAPHICS"
        position={[0.58, 0.02, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.6}
      />
      <Block at={[0.6, 0.18, 0.66]} size={[0.17, 0.13, 0.22]} color="#0c121a" />
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
function EngineeringDetails({ spin }: { spin: boolean }) {
  return (
    <group>
      <Block
        at={[-0.83, 0.15, -0.24]}
        size={[0.045, 2.4, 1.98]}
        color="#132422"
        metal={0.15}
        rough={0.75}
      />
      {/* ATX-style CPU socket, VRM heatsinks, four DIMMs and M.2 spreaders. */}
      <Block at={[-0.75, 0.8, -0.48]} size={[0.12, 0.59, 0.59]} color="#86939e" />
      <Block at={[-0.61, 0.8, -0.48]} size={[0.23, 0.46, 0.46]} color="#19222b" />
      <Label
        text="CPU / AIO"
        position={[-0.48, 0.8, -0.48]}
        rotation={[0, Math.PI / 2, 0]}
        width={0.43}
      />
      <Block at={[-0.7, 1.3, -0.5]} size={[0.2, 0.22, 0.85]} color="#59656f" />
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i}>
          <Block at={[-0.76, 0.7, 0.16 + i * 0.16]} size={[0.14, 1.08, 0.065]} color="#151c24" />
          <Block at={[-0.66, 0.7, 0.16 + i * 0.16]} size={[0.07, 0.91, 0.042]} color="#87929c" />
        </group>
      ))}
      {[-0.15, -0.82].map((y) => (
        <Block key={y} at={[-0.72, y, -0.4]} size={[0.12, 0.15, 0.93]} color="#5c6975" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-0.73, 1.26, -1.08 + i * 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.09, 10]} />
          <meshStandardMaterial color="#b5bdc5" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* Top 240-class radiator, two fans along chassis depth. */}
      <Block at={[0, 1.49, -0.1]} size={[1.14, 0.18, 2.32]} color="#141c23" />
      {Array.from({ length: 32 }, (_, i) => (
        <Block
          key={i}
          at={[0, 1.595, -1.16 + i * 0.067]}
          size={[1.02, 0.045, 0.018]}
          color="#596773"
          rough={0.6}
        />
      ))}
      {[-0.67, 0.45].map((z) => (
        <Fan key={z} at={[0, 1.68, z]} radius={0.43} spin={spin} />
      ))}
      {[0, 0.12].map((o, i) => (
        <Cable
          key={i}
          points={[
            [-0.49, 0.9, -0.55 + o],
            [-0.12, 1.03, -0.73 + o],
            [0.43, 1.25, -0.8 + o],
            [0.43, 1.49, -0.93 + o],
          ]}
          radius={0.042}
          color="#1a222b"
        />
      ))}
      {/* Front intake and rear exhaust on physically consistent axes. */}
      {[-0.64, 0.37, 1.33].map((y) => (
        <group key={y} position={[0, y, 1.53]} rotation={[Math.PI / 2, 0, 0]}>
          <Fan at={[0, 0, 0]} radius={0.43} spin={spin} />
        </group>
      ))}
      <group position={[0.1, 0.82, -1.57]} rotation={[Math.PI / 2, 0, 0]}>
        <Fan at={[0, 0, 0]} radius={0.4} spin={spin} />
      </group>
      <Block at={[0, -1.4, -0.85]} size={[1.22, 0.6, 1.27]} color="#202830" />
      <Block at={[0, -1.06, 0]} size={[1.73, 0.065, 3.13]} color="#29333e" />
      <Label
        text="ISOLATED POWER / CABLE BAY"
        position={[0.9, -1.42, 0.05]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.5}
      />
      {Array.from({ length: 4 }, (_, i) => (
        <Cable
          key={i}
          points={[
            [0.64, -0.1, 0.6 + i * 0.04],
            [0.79, -0.38, 0.65 + i * 0.04],
            [0.76, -0.85, 0.5 + i * 0.04],
            [0.52, -1.25, 0.36 + i * 0.04],
          ]}
          radius={0.018}
        />
      ))}
      <Block at={[-0.38, 0.72, -1.67]} size={[0.5, 1.35, 0.035]} color="#424e5b" />
      {Array.from({ length: 6 }, (_, i) => (
        <Block
          key={i}
          at={[-0.38, 0.21 + i * 0.2, -1.695]}
          size={[0.31, 0.1, 0.02]}
          color="#0d1117"
        />
      ))}
      <Block at={[0.2, -1.4, -1.69]} size={[0.28, 0.18, 0.06]} color="#10151b" />
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
      <EngineeringDetails spin={spin} />
      <Block at={[0, -1.8, 0]} size={[1.96, 0.13, 3.5]} color="#667380" />
      <Block at={[-0.94, 0, 0]} size={[0.045, 3.55, 3.4]} color="#34414d" rough={0.48} />
      {[-0.93, 0.93].flatMap((x) =>
        [-1.65, 1.65].map((z) => (
          <Block key={`${x}${z}`} at={[x, 0, z]} size={[0.055, 3.6, 0.055]} color="#73808b" />
        )),
      )}
      {[-0.7, 0.7].flatMap((x) =>
        [-1.25, 1.25].map((z) => (
          <Block
            key={`${x}${z}`}
            at={[x, -1.95, z]}
            size={[0.23, 0.19, 0.38]}
            color="#111920"
            rough={0.75}
          />
        )),
      )}
      <group ref={gpu}>
        <group position={[-0.06, -0.3, -0.27]}>
          <GPU spin={spin} />
        </group>
      </group>
      <group ref={roof}>
        <Block at={[0, 1.85, 0]} size={[1.96, 0.075, 3.5]} color="#88949f" rough={0.4} />
        {Array.from({ length: 24 }, (_, i) => (
          <Block
            key={i}
            at={[0, 1.891, -1.45 + i * 0.125]}
            size={[1.56, 0.006, 0.035]}
            color="#18232d"
          />
        ))}
      </group>
      <group ref={front}>
        <Block at={[0, 0, 1.73]} size={[1.92, 3.58, 0.09]} color="#15212e" rough={0.38} />
        <Block at={[0, -0.2, 1.782]} size={[1.69, 2.63, 0.014]} color="#070f17" rough={0.8} />
        {Array.from({ length: 29 }, (_, i) => (
          <Block
            key={i}
            at={[-0.81 + i * 0.058, -0.2, 1.805]}
            size={[0.019, 2.59, 0.028]}
            color={i % 4 === 0 ? '#65747f' : '#384753'}
            metal={0.78}
            rough={0.4}
          />
        ))}
        {[-0.91, 0.91].map((x) => (
          <Block
            key={x}
            at={[x, 0, 1.785]}
            size={[0.014, 3.46, 0.018]}
            color="#bac1c5"
            rough={0.26}
          />
        ))}
        <GoldBadge position={[-0.28, 1.38, 1.79]} scale={0.68} />
        <mesh position={[0.64, 1.42, 1.79]}>
          <ringGeometry args={[0.035, 0.044, 32]} />
          <meshBasicMaterial color="#93bcdf" />
        </mesh>
        {[-0.14, 0.13].map((x) => (
          <Block key={x} at={[x, 1.06, 1.789]} size={[0.15, 0.045, 0.016]} color="#060c13" />
        ))}
        <Block at={[0, -1.59, 1.789]} size={[1.35, 0.009, 0.01]} color="#6f9dbd" metal={0} />
        <Label text="H3 / PRECISION SYSTEMS" position={[0, -1.7, 1.796]} width={1.4} />
      </group>
      <group ref={side}>
        <mesh position={[0.96, 0, 0]}>
          <boxGeometry args={[0.023, 3.48, 3.27]} />
          <meshPhysicalMaterial
            color="#b5c6d2"
            roughness={0.12}
            metalness={0.05}
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>
        {[-1.73, 1.73].map((y) => (
          <Block key={y} at={[0.98, y, 0]} size={[0.04, 0.055, 3.32]} color="#495763" />
        ))}
        {[-1.63, 1.63].map((z) => (
          <Block key={z} at={[0.98, 0, z]} size={[0.04, 3.48, 0.055]} color="#495763" />
        ))}
        {[-1.56, 1.56].flatMap((y) =>
          [-1.48, 1.48].map((z) => (
            <group key={`${y}${z}`} position={[0.999, y, z]} rotation={[0, Math.PI / 2, 0]}>
              <Screw at={[0, 0, 0]} />
            </group>
          )),
        )}
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
      <StudioReflections />
      <ambientLight intensity={0.65} />
      <hemisphereLight intensity={0.7} color="#f5f7ff" groundColor="#111419" />
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
