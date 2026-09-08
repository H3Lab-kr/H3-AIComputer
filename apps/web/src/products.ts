import { t } from './i18n'
export type ProductId = 'core' | 'studio' | 'pro'
export type Product = {
  id: ProductId
  name: string
  descriptor: string
  use: string
  gpu: string
  memory: number
  ram: string
  storage: string
  platform: string
  tasks: string[]
  source: string
  status: string
}
export const products: Product[] = [
  {
    id: 'core',
    name: 'H3 Core',
    descriptor: t('개인의 가능성을 넓히는 시작.'),
    use: t('개인 업무 · 소규모 창작'),
    gpu: 'GeForce RTX 5060 Ti',
    memory: 16,
    ram: '64GB',
    storage: '2TB NVMe',
    platform: 'NVIDIA CUDA',
    tasks: [t('로컬 문서·대화 도구'), t('음성 콘텐츠 제작'), t('가벼운 이미지 워크플로')],
    source: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/',
    status: t('구성 상담'),
  },
  {
    id: 'studio',
    name: 'H3 Studio',
    descriptor: t('아이디어가 결과물이 되는 속도.'),
    use: t('크리에이터 · 개발자 · 스튜디오'),
    gpu: 'GeForce RTX 5090',
    memory: 32,
    ram: '128GB',
    storage: '4TB NVMe',
    platform: 'NVIDIA CUDA',
    tasks: [
      t('이미지 생성·편집 환경'),
      t('크리에이티브 개발 워크플로'),
      t('모델별 영상 제작 구성'),
    ],
    source: 'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/',
    status: t('구성 상담'),
  },
  {
    id: 'pro',
    name: 'H3 Pro',
    descriptor: t('팀의 더 큰 생각을 담는 시스템.'),
    use: t('연구팀 · 전문 제작 · 사내 AI'),
    gpu: 'RTX PRO 6000 Blackwell',
    memory: 96,
    ram: t('256GB · ECC 플랫폼'),
    storage: '8TB NVMe',
    platform: 'NVIDIA CUDA',
    tasks: [t('대형 모델용 메모리 설계'), t('팀 전용 AI 인프라'), t('배포·운영 환경 개별 설계')],
    source:
      'https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/',
    status: t('맞춤 설계'),
  },
]
export const faq = [
  [
    t('일반 고성능 PC와 무엇이 다른가요?'),
    t(
      'GPU 사양만으로 구성하지 않습니다. 사용할 모델과 입력 크기, 동시 작업, 저장 공간을 먼저 확인하고 하드웨어·실행 도구·운영 방식을 함께 설계합니다. 최종 구성과 제공 범위는 상담 후 확정합니다.',
    ),
  ],
  [
    t('GPU 메모리는 어느 정도 필요할까요?'),
    t(
      '모델 가중치뿐 아니라 문맥 길이, 이미지·영상 해상도, 중간 연산과 동시 작업이 메모리를 사용합니다. 16GB·32GB·96GB 구성은 출발점이며, 필요한 모델과 작업으로 확인해야 합니다. 시스템 RAM과 GPU VRAM은 구분합니다.',
    ),
  ],
  [
    t('GPU를 두 장 넣으면 메모리도 하나로 합쳐지나요?'),
    t(
      '자동으로 하나의 메모리 공간이 되지는 않습니다. 분산 추론 지원, 모델 분할, PCIe 연결과 통신 비용을 함께 검토해야 합니다. 멀티 GPU 시스템은 별도 설계 대상으로 상담합니다.',
    ),
  ],
  [
    t('Mac에서도 H3를 사용할 수 있나요?'),
    t(
      '네. Apple Silicon용 H3 앱 Preview를 개발하고 있습니다. 현재 로컬 대화·음성·이미지·영상 실행 도구를 연결하는 화면을 제공하며, 실행 도구와 모델은 별도로 준비합니다. NVIDIA 환경용 앱 통합은 후속 검증 단계입니다.',
    ),
  ],
  [
    t('인터넷 없이 사용할 수 있나요?'),
    t(
      '모델과 필요한 실행 도구가 준비된 뒤 로컬 추론으로 구성할 수 있습니다. 초기 설치·업데이트·선택한 외부 API 기능에는 네트워크가 필요할 수 있습니다. 실제 오프라인 범위와 모델 라이선스는 도입 구성에서 확인합니다.',
    ),
  ],
  [
    t('가격과 출고 일정은 어떻게 확인하나요?'),
    t(
      '현재 표시된 제품은 구성 제안입니다. GPU 공급 상황과 CPU·메모리·저장 공간, 설치·지원 범위를 확인한 뒤 견적과 일정을 안내합니다. 웹사이트에서 결제나 예약금을 받지 않습니다.',
    ),
  ],
]
