# H3 NVIDIA 패키지 설계안

기준일: 2026-09-09. **아래는 구성·검증 제안이며, 출고 제품이나 실측 인증 사양이 아니다.** 현재 개발 장비는 Apple Silicon이다. CUDA 실측 없이 Mac 측정치를 NVIDIA 성능으로 환산하지 않는다.

## 제품 구조

| | H3 Core | H3 Studio | H3 Pro |
|---|---|---|---|
| 고객 | 개인 업무·소규모 창작 | 제작자·개발자·스튜디오 | 연구팀·사내 AI·전문 제작 |
| GPU | RTX 5060 Ti **16GB 모델** | RTX 5090 32GB | RTX PRO 6000 Blackwell **Workstation Edition**, 96GB ECC |
| 시스템 RAM 제안 | 64GB | 128GB | 256GB, CPU·보드까지 ECC 지원 확인 |
| 저장 장치 제안 | 2TB NVMe | 4TB NVMe | 8TB NVMe, 데이터·모델 볼륨 분리 검토 |
| CPU 플랫폼 | 데스크톱 8–12코어급부터 작업별 선정 | 12–16코어급부터 CPU 오프로딩·인코딩 검증 | 워크스테이션급, PCIe 레인·ECC·증설 기준 선정 |
| 납품 단위 | 개인용 모델 1개 + 작업 흐름 1개 | 대화·음성·이미지, 영상은 모델별 확인 | 동시 사용자·권한·백업·운영 범위 별도 설계 |

GPU 메모리는 [5060 제품군](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/), [5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/), [PRO 6000](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/) 공식 사양을 확인했다. RAM·SSD·CPU 범위는 H3의 설계 제안이다. 같은 GPU 이름이라도 보드 제조사별 크기·전력·냉각이 다르므로 최종 BOM에 부품 번호를 고정한다.

## 소프트웨어 구성 후보

| 기능 | 우선 후보·실행 경로 | 구성별 검증 방향 |
|---|---|---|
| 개인 대화 | Qwen3.5-9B, CUDA 지원 런타임 | Core: 4bit 후보, 짧은 문맥·1요청부터. 정확한 양자화 파일과 백엔드 지원을 확인 |
| 고급 대화 | Qwen3.8-27B, CUDA 지원 런타임 | Studio: 4bit 후보. Pro: 8bit/BF16 후보를 실제 문맥 길이와 비교. MLX 전용 파일은 CUDA에 사용하지 않음 |
| 한국어 음성 | Qwen3-TTS 1.7B CustomVoice, 공식 PyTorch 경로 | Sohee 한국어를 시작점으로 발음·음색·문장 간 볼륨 검토. 언어 모델과 동시 상주하지 않는 구성을 우선 |
| 이미지 | FLUX.2 klein 4B, Diffusers 또는 공식 지원 ComfyUI 워크플로 | 1024px·4스텝 단일 요청부터. Core는 CPU offload와 VRAM 피크를 확인; Studio는 offload 비용 비교 |
| 영상 | LTX Desktop의 로컬 CUDA 경로를 비교 후보로 추가 | 공식 문서는 Windows/Linux CUDA 16GB 이상 경로를 안내하지만 H3 장비에서 속도·해상도·동시 작업을 보증하지 않음 |
| MiniMax H3 영상 | 현재 Mac 엔진 연동과 NVIDIA 지원 구현을 별도로 관리 | 지원 FL2VA/FLVA 작업, 체크포인트·어댑터·스케줄·VRAM·영상/음성 품질·상업 이용 조건 확인 전 기본 제공 모델로 약속하지 않음 |

근거: [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B), [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B), [Qwen3-TTS 공식 구현](https://github.com/QwenLM/Qwen3-TTS), [FLUX.2 klein 4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B), [LTX Desktop](https://github.com/Lightricks/LTX-Desktop).

FLUX.2 klein **4B**의 Apache 2.0 표기를 다른 크기 모델에 확대 적용하지 않는다. LTX 2.5의 gated weights는 별도 접근·라이선스 절차가 있다. 모델 재배포·상업 사용·고객 설치는 정확한 버전의 조건을 확인한 뒤 제공 범위에 포함한다. 이 문서는 법적 이용권을 부여하지 않는다.

## 전력·냉각·운영 설계

- RTX 5090 공식 기준 GPU 전력은 575W, 요구 시스템 전력은 1000W이다. 실제 CPU·보드·부하와 GPU 제조사 요구를 확인해 전원 용량과 케이블을 확정한다. 최대 전력은 평균 사용 전력이나 월 요금이 아니다.
- PRO 6000 Workstation Edition은 최대 600W GPU이므로 별도 열·소음·공간 검증이 필요하다. Max-Q/Server Edition과 혼용하지 않는다.
- 메모리는 모델 가중치뿐 아니라 KV cache, 텍스트 인코더, VAE, 활성화, 화면 표시 여유를 포함한다. 32GB VRAM에 27B 8bit 가중치가 들어간다는 이유로 실사용을 보증하지 않는다.
- 첫 상품은 **단일 GPU·한 번에 하나의 생성 작업**을 기준으로 설계한다. 두 GPU의 VRAM은 자동 합산되지 않는다. 멀티 GPU는 분산 지원·PCIe·동기화 비용까지 별도 평가한다.
- 크리에이터는 Windows 네이티브 지원 도구를, 서버 운영은 Linux 환경을 검증 트랙으로 분리한다. WSL2를 사용할 경우 경로·드라이버·메모리·재시작 동작을 따로 기록한다.
- 모델별 환경을 분리하고 드라이버·CUDA·PyTorch·커널 확장·모델 리비전을 고정한다. Blackwell 지원은 패키지 버전과 실제 실행으로 확인한다.

## 출고 전 수락 기준

1. 모델·OS·드라이버·실행 도구·부품 목록을 고정하고 설치/복구 안내를 재현한다.
2. 같은 입력으로 콜드 시작 3회, 준비 후 5회 측정. 전체 응답 시간·첫 토큰·생성 처리량·VRAM·시스템 RAM·벽전력을 구분한다.
3. 동시 상주, 메모리 부족, 취소 후 다음 요청, 재부팅, 네트워크 차단 상태를 검증한다.
4. 고객 업무 예제와 별도 평가 예제로 정답·발음·이미지·영상 품질을 평가한다. 대표 결과와 실패 결과를 함께 기록한다.
5. 합의한 연속 부하 구간에서 온도·전력·소음·클럭·오류를 기록한다. 측정 위치와 실내 조건을 남긴다.
6. 가격에는 하드웨어, 설치, 지원, 보증 범위를 분리한다. 품질 기준을 통과한 결과 1건당 시간·전력·재생성 횟수로 가성비를 비교한다.

## 사업 메시지

**H3는 GPU를 파는 데서 끝나지 않고, 고객의 일이 실행되는 컴퓨터를 설계한다.** 공개 페이지에는 실제 구성·지원 범위를 표시하고, 추후 실측 보고서를 제품별로 연결한다. 공급 계약·보증 정책·인증·상표 사용권·실제 외관이 확정되기 전에는 완료된 사실로 표현하지 않는다. 현재 3D 외관은 독자 제작한 시스템 구조 컨셉이다.
