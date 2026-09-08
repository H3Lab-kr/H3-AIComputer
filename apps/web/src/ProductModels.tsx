import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
export type Family = 'nvidia' | 'mini' | 'studio' | 'macpro'
export function GoldBadge({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const x = c.getContext('2d')!
    const g = x.createLinearGradient(0, 0, 512, 256)
    g.addColorStop(0, '#745120')
    g.addColorStop(0.22, '#ebd394')
    g.addColorStop(0.48, '#ba904a')
    g.addColorStop(0.7, '#fff0be')
    g.addColorStop(1, '#88612b')
    x.fillStyle = g
    x.fillRect(0, 0, 512, 256)
    x.strokeStyle = '#f7e4ad'
    x.lineWidth = 5
    x.strokeRect(15, 15, 482, 226)
    x.fillStyle = '#302214'
    x.textAlign = 'center'
    x.font = 'bold 135px Paperozi'
    x.fillText('H3', 256, 159)
    x.font = '18px Paperozi'
    x.fillText('AI COMPUTERS', 256, 210)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[0.64, 0.32, 0.035]} radius={0.035} smoothness={3}>
        <meshStandardMaterial color="#d2ac63" metalness={0.85} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[0.6, 0.29]} />
        <meshStandardMaterial map={texture} metalness={0.65} roughness={0.32} />
      </mesh>
    </group>
  )
}
function MetalBox({
  size,
  at = [0, 0, 0],
  color = '#e5e7ec',
  radius = 0.15,
}: {
  size: [number, number, number]
  at?: [number, number, number]
  color?: string
  radius?: number
}) {
  return (
    <RoundedBox args={size} position={at} radius={radius} smoothness={4} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.3} />
    </RoundedBox>
  )
}
export function MacModel({ family }: { family: Exclude<Family, 'nvidia'> }) {
  if (family === 'macpro')
    return (
      <group position={[0, -0.05, 0]} scale={[0.82, 1, 1.5]}>
        <MetalBox size={[2.05, 3.6, 2.3]} radius={0.15} />
        {Array.from({ length: 12 }, (_, r) =>
          Array.from({ length: 7 }, (_, c) => (
            <mesh
              key={`${r}-${c}`}
              position={[-0.78 + c * 0.26 + (r % 2) * 0.02, -1.4 + r * 0.245, 1.153]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.105, 0.065, 0.035, 24]} />
              <meshStandardMaterial color="#323b47" metalness={0.6} roughness={0.45} />
            </mesh>
          )),
        )}
        {[-0.72, 0.72].map((x) => (
          <group key={x}>
            <MetalBox at={[x, 1.97, 0]} size={[0.14, 0.16, 1.9]} radius={0.07} />
            <MetalBox at={[x, -1.96, 0]} size={[0.14, 0.25, 1.9]} radius={0.06} />
          </group>
        ))}
        <GoldBadge position={[0, 1.42, 1.18]} scale={0.9} />
      </group>
    )
  const mini = family === 'mini',
    w = mini ? 2.1 : 2.8,
    h = mini ? 0.82 : 1.35,
    d = mini ? 2.1 : 2.8
  return (
    <group position={[0, -0.6, 0]}>
      <MetalBox size={[w, h, d]} radius={0.17} />
      <MetalBox
        size={[w * 0.85, 0.12, d * 0.85]}
        at={[0, -h / 2 - 0.04, 0]}
        color="#1e232a"
        radius={0.12}
      />
      {[-0.48, -0.18].map((x) => (
        <MetalBox
          key={x}
          at={[x, -h * 0.19, d / 2 + 0.004]}
          size={mini ? [0.055, 0.16, 0.018] : [0.055, 0.13, 0.018]}
          radius={0.015}
          color="#181d23"
        />
      ))}
      {mini ? (
        <mesh position={[0.65, -h * 0.19, d / 2 + 0.017]}>
          <circleGeometry args={[0.036, 20]} />
          <meshStandardMaterial color="#1b2331" />
        </mesh>
      ) : (
        <MetalBox
          at={[0.33, -h * 0.19, d / 2 + 0.015]}
          size={[0.38, 0.035, 0.018]}
          radius={0.01}
          color="#17202d"
        />
      )}
      {Array.from({ length: 20 }, (_, i) => (
        <MetalBox
          key={`vent-${i}`}
          at={[-w * 0.38 + i * w * 0.04, -h / 2 - 0.025, -d / 2 + 0.08]}
          size={[0.025, 0.08, 0.024]}
          radius={0.004}
          color="#142033"
        />
      ))}
      <mesh position={[mini ? 0.43 : w * 0.32, -h * 0.19, d / 2 + 0.016]}>
        <circleGeometry args={[0.024, 16]} />
        <meshBasicMaterial color="#d9e7fa" />
      </mesh>
      <GoldBadge
        position={[0, h / 2 + 0.025, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={mini ? 0.75 : 0.9}
      />
      {!mini && <GoldBadge position={[0.72, 0.23, d / 2 + 0.02]} scale={0.65} />}
    </group>
  )
}
