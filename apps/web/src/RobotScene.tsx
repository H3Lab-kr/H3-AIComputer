import { t } from './i18n'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Line } from '@react-three/drei'
import * as THREE from 'three'
import { GoldBadge } from './ProductModels'
function Box({
  at,
  size,
  color = '#a7b3c2',
}: {
  at: [number, number, number]
  size: [number, number, number]
  color?: string
}) {
  return (
    <RoundedBox args={size} radius={0.04} smoothness={2} position={at}>
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.32} />
    </RoundedBox>
  )
}
function Link({ a, b }: { a: THREE.Vector3; b: THREE.Vector3 }) {
  const d = b.clone().sub(a)
  return (
    <group
      position={a.clone().add(b).multiplyScalar(0.5)}
      quaternion={new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.clone().normalize(),
      )}
    >
      <Box at={[0, 0, 0]} size={[0.24, d.length(), 0.3]} color="#dc8c43" />
      <Box at={[0, 0, 0.165]} size={[0.12, d.length() * 0.65, 0.025]} color="#272f3a" />
    </group>
  )
}
const smooth = (x: number) => {
  x = Math.max(0, Math.min(1, x))
  return x * x * (3 - 2 * x)
}
export function armPose(progress: number) {
  const u = smooth((progress - 0.25) / 0.43)
  const pick = smooth(progress / 0.23)
  return {
    x: progress < 0.25 ? 0.65 + 1.2 * pick : 1.85 - 1.25 * u,
    y: progress < 0.25 ? 1.45 - 1.03 * pick : 0.42 + Math.sin(u * Math.PI) * 1.25,
    z: progress < 0.25 ? 0 : -u,
    held: progress >= 0.25 && progress < 0.7,
    placed: progress >= 0.7,
  }
}
export function Cell({ progress }: { progress: number }) {
  const pose = armPose(progress),
    l1 = 1.55,
    l2 = 1.3
  const dy = pose.y - 0.45
  const radial = Math.hypot(pose.x, pose.z)
  const c = Math.max(-1, Math.min(1, (radial ** 2 + dy ** 2 - l1 * l1 - l2 * l2) / (2 * l1 * l2)))
  const elbow = -Math.acos(c),
    angle = Math.atan2(dy, radial) - Math.atan2(l2 * Math.sin(elbow), l1 + l2 * Math.cos(elbow))
  const a = new THREE.Vector3(0, 0.45, 0),
    b = new THREE.Vector3(
      (l1 * Math.cos(angle) * pose.x) / radial,
      0.45 + l1 * Math.sin(angle),
      (l1 * Math.cos(angle) * pose.z) / radial,
    ),
    end = new THREE.Vector3(pose.x, pose.y, pose.z)
  return (
    <group position={[0, -0.45, 0]}>
      <Box at={[0, -0.22, 0]} size={[5.6, 0.18, 3.3]} color="#2e3742" />
      <gridHelper args={[5.4, 18, '#7a8ca3', '#414e5e']} position={[0, -0.12, 0]} />
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.44, 0.55, 0.42, 40]} />
        <meshStandardMaterial color="#5b6c82" metalness={0.8} roughness={0.3} />
      </mesh>
      <Link a={a} b={b} />
      <Link a={b} b={end} />
      {[a, b, end].map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[i === 2 ? 0.16 : 0.23, i === 2 ? 0.16 : 0.23, 0.39, 32]} />
          <meshStandardMaterial color="#d3d9e0" metalness={0.9} roughness={0.23} />
        </mesh>
      ))}
      <group position={end}>
        <Box at={[0, -0.12, 0]} size={[0.38, 0.11, 0.25]} color="#212b37" />
        {[-1, 1].map((s) => (
          <Box
            key={s}
            at={[s * (pose.held ? 0.12 : 0.22), -0.27, 0]}
            size={[0.065, 0.3, 0.19]}
            color="#b6c0cd"
          />
        ))}
      </group>
      <Box
        at={[
          pose.held ? pose.x : pose.placed ? 0.6 : 1.85,
          pose.held ? pose.y - 0.37 : 0.04,
          pose.held ? pose.z : pose.placed ? -1 : 0,
        ]}
        size={[0.22, 0.3, 0.22]}
        color="#d3b879"
      />
      <Line
        points={[
          [1.85, 0.08, 0.5],
          [1.85, 1.6, 0.5],
          [0.6, 1.6, -1],
          [0.6, 0.08, -1],
        ]}
        color="#749fd7"
        dashed
        dashSize={0.09}
        gapSize={0.06}
        lineWidth={1}
      />
      <Box at={[0.6, -0.08, -1]} size={[0.95, 0.04, 0.9]} color="#6a7d97" />
      <Box at={[-1.6, 1.0, -1.35]} size={[0.11, 2.4, 0.12]} color="#687b95" />
      <Box at={[-0.5, 2.2, -1.35]} size={[2.2, 0.12, 0.12]} color="#687b95" />
      <Box at={[0.6, 2.05, -1.35]} size={[0.35, 0.24, 0.3]} color="#222e3e" />
      <mesh position={[0.6, 1.91, -1.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 24]} />
        <meshStandardMaterial color="#5991db" emissive="#24508a" emissiveIntensity={0.7} />
      </mesh>
      <group position={[-2.0, 0.45, 1]}>
        <Box at={[0, 0, 0]} size={[0.75, 1.15, 0.65]} color="#6a7e98" />
        <GoldBadge position={[0, 0.28, 0.35]} scale={0.65} />
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            at={[-0.28 + i * 0.08, -0.14, 0.33]}
            size={[0.022, 0.45, 0.025]}
            color="#242e3c"
          />
        ))}
      </group>
      <Line
        points={[
          [-2, 0.0, 1],
          [-2, -0.07, 0.45],
          [0, -0.07, 0.45],
          [0, 0.1, 0],
        ]}
        color="#d1b170"
        lineWidth={2}
      />
      <axesHelper args={[0.65]} position={[-2.4, -0.09, 1.4]} />
    </group>
  )
}
export default function RobotScene({
  progress,
  active,
  reduced,
}: {
  progress: number
  active: boolean
  reduced: boolean
}) {
  return (
    <Canvas
      aria-label={t('H3 AI 컴퓨터와 로봇 팔의 제품 촬영 시뮬레이션')}
      camera={{ position: [5, 3.9, 6.4], fov: 39 }}
      dpr={[1, 1.5]}
      frameloop={active ? 'demand' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={1.8} />
      <hemisphereLight intensity={1.4} color="#e7eef6" groundColor="#141c27" />
      <directionalLight position={[2, 6, 5]} intensity={3.5} color="#f9e5bf" />
      <directionalLight position={[-3, 2, -3]} intensity={2.5} color="#80a7d9" />
      <Cell progress={progress} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping={!reduced}
        minPolarAngle={0.6}
        maxPolarAngle={1.45}
      />
    </Canvas>
  )
}
