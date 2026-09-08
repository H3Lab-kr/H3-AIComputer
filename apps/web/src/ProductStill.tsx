import { Canvas } from '@react-three/fiber'
import { GoldBadge, MacModel } from './ProductModels'
import type { Family } from './ProductModels'
import { Workstation } from './HardwareScene'
export default function ProductStill() {
  const kind = new URLSearchParams(location.search).get('product') as Family
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent' }}>
      <Canvas
        camera={{ position: [5.8, 3.7, 7.5], fov: 33 }}
        dpr={1}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={1.8} />
        <hemisphereLight intensity={1.6} color="#f5f7ff" groundColor="#252d38" />
        <directionalLight position={[2, 5, 5]} intensity={4} color="#f0f5ff" />
        <directionalLight position={[-4, 2, -3]} intensity={3.5} color="#f0f5ff" />
        <directionalLight position={[4, 1, -2]} intensity={3} color="#f0f5ff" />
        <group
          position={[0, kind === 'mini' || kind === 'studio' ? 0.65 : 0, 0]}
          scale={kind === 'mini' ? 1.8 : kind === 'studio' ? 1.4 : 1}
        >
          {kind === 'nvidia' ? (
            <Workstation exploded={false} paused reduced />
          ) : kind === 'mini' || kind === 'studio' || kind === 'macpro' ? (
            <MacModel family={kind} />
          ) : (
            <GoldBadge />
          )}
        </group>
      </Canvas>
    </div>
  )
}
