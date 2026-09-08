import { t as tr } from './i18n'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Cell } from './RobotScene'
import { GoldBadge, MacModel } from './ProductModels'
import { Workstation } from './HardwareScene'
import './film.css'
declare global {
  interface Window {
    setFilmTime?: (time: number) => Promise<void>
  }
}
const scenes = [
  {
    start: 0,
    end: 4,
    tag: 'H3LAB PRESENTS',
    title: tr('컴퓨터의\n다음 가능성.'),
    sub: 'A NEW FORM OF PERSONAL INTELLIGENCE',
  },
  {
    start: 4,
    end: 10,
    tag: 'H3 PERFORMANCE / NVIDIA RTX',
    title: tr('내 컴퓨터 안에,\n나만의 AI.'),
    sub: tr('목적에 맞는 GPU. 함께 설계하는 AI 환경.'),
  },
  {
    start: 10,
    end: 14,
    tag: 'H3 MINI / MAC MINI PACKAGE',
    title: tr('작은 책상에서.'),
    sub: tr('개인의 업무와 아이디어가 시작되는 곳.'),
  },
  {
    start: 14,
    end: 18,
    tag: 'H3 MAC STUDIO / CREATIVE PACKAGE',
    title: tr('더 큰 창작까지.'),
    sub: tr('사진에서 이미지로. 장면에서 영상으로.'),
  },
  {
    start: 18,
    end: 22,
    tag: 'H3 MAC PRO / EXISTING SYSTEM',
    title: tr('이미 갖춘 인프라에,\n새로운 지능.'),
    sub: tr('보유한 Mac Pro에 맞춰 설계하는 AI 환경.'),
  },
  {
    start: 22,
    end: 26,
    tag: 'ONE PURPOSE. MANY POSSIBILITIES.',
    title: tr('연결하고, 움직입니다.'),
    sub: tr('업무 비서·카메라·로봇 연동은 장치별 검증을 거쳐 구축할 영역.'),
  },
  {
    start: 26,
    end: 30,
    tag: 'YOUR AI. YOUR COMPUTER.',
    title: 'H3',
    sub: tr('당신의 가능성이 머무를 곳.'),
  },
]
function FilmObjects({ t, index }: { t: number; index: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ camera }) => {
    if (!group.current) return
    const s = scenes[index],
      p = (t - s.start) / (s.end - s.start)
    group.current.rotation.y =
      index === 0 ? -0.15 + p * 0.22 : index === 6 ? -0.12 + p * 0.2 : -0.25 + p * 0.6
    group.current.position.y = Math.sin(p * Math.PI) * 0.08
    camera.position.set(index === 0 ? 1.2 : 6.7, index === 0 ? 0.6 : 3.0, index === 0 ? 5.4 : 8.8)
    camera.lookAt(index === 0 ? 0 : 0.45, 0, 0)
    camera.updateProjectionMatrix()
  })
  return (
    <group ref={group}>
      {index === 0 || index === 6 ? (
        <group scale={index === 0 ? 4.3 : 3.8}>
          <GoldBadge />
        </group>
      ) : index === 1 ? (
        <group scale={0.95}>
          <Workstation
            exploded={false}
            explosion={
              Math.min(1, Math.max(0, (t - 5.2) / 1.5)) * Math.min(1, Math.max(0, (9.7 - t) / 0.8))
            }
            reduced
            paused
          />
        </group>
      ) : index === 2 ? (
        <group scale={1.6}>
          <MacModel family="mini" />
        </group>
      ) : index === 3 ? (
        <group scale={1.4}>
          <MacModel family="studio" />
        </group>
      ) : index === 4 ? (
        <MacModel family="macpro" />
      ) : (
        <group scale={0.85}>
          <Cell progress={Math.min(1, Math.max(0, (t - 22) / 4))} />
        </group>
      )}
    </group>
  )
}
export default function BrandFilm() {
  const [t, setT] = useState(0)
  const index = Math.max(
      0,
      scenes.findIndex((s) => t >= s.start && t < s.end),
    ),
    s = scenes[index],
    p = (t - s.start) / (s.end - s.start),
    enter = Math.min(1, Math.max(0, p * 7)),
    exit = Math.min(1, Math.max(0, (1 - p) * 8))
  useEffect(() => {
    window.setFilmTime = async (time) => {
      flushSync(() => setT(Math.min(29.999, Math.max(0, time))))
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    }
    return () => {
      delete window.setFilmTime
    }
  }, [])
  return (
    <div className={`film-composition film-scene-${index}`}>
      <div className="film-grid" />
      <div
        className="film-orbit"
        style={{ transform: `translate(-50%,-50%) rotate(${t * 2}deg)` }}
      />
      <div className="film-top">
        <span>
          H3<span className="film-dot">.</span>
        </span>
        <small>AI COMPUTERS / H3LAB</small>
      </div>
      <div className="film-objects" style={{ opacity: Math.min(1, enter * 1.5, exit * 1.5) }}>
        <Canvas
          camera={{ position: [6.7, 3, 8.8], fov: 34 }}
          dpr={1}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          frameloop="always"
        >
          <ambientLight intensity={1.8} />
          <hemisphereLight intensity={1.4} color="#f5f7ff" groundColor="#161e28" />
          <directionalLight position={[2, 5, 5]} intensity={4} color="#f0f5ff" />
          <directionalLight position={[-5, 2, -2]} intensity={4} color="#f0f5ff" />
          <directionalLight position={[5, -1, -2]} intensity={3} color="#f0f5ff" />
          <FilmObjects t={t} index={index} />
        </Canvas>
      </div>
      <div
        className="film-words"
        style={{ opacity: enter * exit, transform: `translateY(${(1 - enter) * 30}px)` }}
      >
        <p>{s.tag}</p>
        <h1>{s.title}</h1>
        <h2>{s.sub}</h2>
        {index === 6 && <strong>h3lab.kr</strong>}
      </div>
      <div className="film-bottom">
        <span>ENGINEERED FOR YOUR INTELLIGENCE</span>
        <span>
          {index === 4
            ? tr('Apple Silicon Mac Pro 보유 장비 도입 컨셉')
            : tr('H3 패키지 디자인 컨셉 · 실제 구성·지원 범위는 상담 후 확정')}
        </span>
        <b>{String(index + 1).padStart(2, '0')} / 07</b>
      </div>
      <div className="film-progress" style={{ width: `${(t / 30) * 100}%` }} />
    </div>
  )
}
