import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MacModel } from './ProductModels'
import type { Family } from './ProductModels'
import { Workstation } from './HardwareScene'
function Display({ family, paused }: { family: Family; paused: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((s, dt) => {
    if (ref.current) {
      ref.current.scale.lerp(
        new THREE.Vector3().setScalar(family === 'mini' ? 1.8 : family === 'studio' ? 1.35 : 1),
        paused ? 1 : 1 - Math.exp(-dt * 5),
      )
      ref.current.position.y =
        (family === 'mini' || family === 'studio' ? 0.5 : 0) +
        (paused ? 0 : Math.sin(s.clock.elapsedTime * 0.65) * 0.055)
      if (!paused) {
        ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.28) * 0.14
      }
    }
  })
  return (
    <group ref={ref} scale={0.8}>
      {family === 'nvidia' ? (
        <Workstation exploded={false} reduced={paused} paused={paused} />
      ) : (
        <MacModel family={family} />
      )}
    </group>
  )
}
export default function ShowroomScene({
  family,
  paused,
  active,
}: {
  family: Family
  paused: boolean
  active: boolean
}) {
  return (
    <Canvas
      camera={{ position: [5.8, 3.7, 7.2], fov: 34 }}
      dpr={[1, 1.5]}
      frameloop={!active ? 'never' : paused ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={1.7} />
      <hemisphereLight intensity={1.5} color="#f5f7ff" groundColor="#141920" />
      <directionalLight position={[3, 5, 4]} intensity={4} color="#f0f5ff" />
      <directionalLight position={[-4, 1, -3]} intensity={3.5} color="#f0f5ff" />
      <directionalLight position={[5, 2, -2]} intensity={3} color="#f0f5ff" />
      <Suspense fallback={null}>
        <Display key={family} family={family} paused={paused} />
        <ContactShadows
          position={[0, -2, 0]}
          scale={12}
          blur={3}
          opacity={0.4}
          far={5}
          resolution={256}
          frames={1}
        />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.8}
        maxPolarAngle={1.55}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={1.35}
      />
    </Canvas>
  )
}
