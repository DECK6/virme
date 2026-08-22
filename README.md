# Virtueme Generative Portrait MVP

개인 데이터로 이동하는 StyleGAN 잠재공간과 중앙 초상을 결합한 Virtueme 생성 초상 연구입니다. 현재 공개 MVP는 하나의 잠재 장면을 12초 폐루프 영상으로 보여줍니다.

공개 페이지: [dexa.art/virme](https://dexa.art/virme/)

## Run

```bash
bun install
bun run model:setup
bun run model:serve
```

두 번째 터미널에서 웹 앱을 실행합니다.

```bash
bun run dev
```

`dexa.art/virme/`용 정적 빌드는 다음 명령으로 생성합니다.

```bash
bun run build:public
```

## Scope

- 중앙에 유지되는 투명 배경 합성 초상 1개
- 단일 `STABILITY` 예시와 하나의 잠재 풍경
- [Lucid Sonic Dreams](https://github.com/mikael-alafriz-deel/lucid-sonic-dreams)의 누적 latent controller 구조를 개인 데이터용으로 TypeScript 포팅
- [Raspberry - Saje 레퍼런스 영상](https://www.youtube.com/watch?v=iEFqcMrszH0)의 고밀도 GAN 질감·프레임 용융감을 시각 기준으로 사용
- 개인 데이터, 실제 StyleGAN2 생성 프레임, 사전 렌더 잠재 루프의 시각적 라우팅 MVP
- Apple Silicon의 PyTorch MPS에서 로컬 추론하고 StyleGAN 모드에서는 생성 프레임 자체를 주 화면으로 표시

중앙 초상은 공개 장면의 독립된 기준 레이어로 유지됩니다.

## Lucid Sonic Dreams mapping

- 개인 데이터의 안정·새로움·충돌·불확실성·가능성 값을 0..1 파생 신호로 정규화
- `generate_vectors` → `stepLucidState`: 데이터 활동량과 상태 변화량을 latent에 합성
- 원본의 0.75 시간 평활 계수를 활동량·변화량에 적용
- `update_motion_signs` → truncation 경계에서 이동 방향 반전
- `generate_class_vec` → 다섯 개인 상태 신호로 latent 축과 색상군 변조
- 개인 데이터가 없을 때만 익명 데모 프로필로 controller 구동
- 개인 데이터의 다섯 신호로 여러 StyleGAN `W` latent를 혼합하고 activity·change·confidence로 truncation과 변이 seed를 제어
- StyleGAN 모드에서는 완성 RGB 초상을 출력하지 않는다. 여섯 `W` latent를 서로 다른 공간 영역에 배치하고 32×32 중간 feature의 가중 분산, 즉 latent 영역 사이의 구조를 RGB로 투영한다.
- latent curl flow field는 명시적으로 procedural fallback을 선택했을 때만 렌더링
- 중앙 초상은 모델 및 절차적 생성장 위의 독립 레이어로 항상 유지

## Mac model runtime

- 런타임: NVIDIA `stylegan2-ada-pytorch`
- 현재 기본 체크포인트: NVIDIA StyleGAN2 LSUN Church `stylegan2-church-config-f.pkl`, 256×256. 사람 대신 건물·하늘·나무·길 같은 풍경의 잠재 구조를 사용한다.
- 장치: Apple Silicon `mps`, 지원되지 않는 연산만 CPU fallback
- 렌더 모드: `latent-structure`; 여러 잠재점의 128×128 중간 RGB 합성 단계에서 공통 윤곽·차이·비선형 잔차를 추출하고 이를 명확한 면·능선 단계로 분절한다. 완성 이미지는 직접 노출하지 않는다.
- 배경 모드: 다섯 잠재점을 smootherstep으로 폐루프 보간한 12초·144프레임 H.264 영상을 효과 없이 직접 재생한다. `bun run model:video`로 재생성한다.
- 실제 측정 smoke output: `generated/stylegan-mac-smoke.jpg`
- 체크포인트 교체: `VIRTUEME_STYLEGAN_MODEL=/absolute/model.pkl bun run model:serve`

Lucid Sonic Dreams 예제의 `Abstract Photos` 가중치는 기존 MEGA 배포 링크가 응답하지 않고, `Abstract art` 가중치의 Google Drive 공개 다운로드도 현재 사용할 수 없었습니다. 따라서 지금 화면은 **Lucid의 latent 보간 방식을 적용한 실제 StyleGAN2 파이프라인**이지만, 동일한 추상 체크포인트라고 주장하지 않습니다. 해당 `.pkl`을 확보하면 서비스 코드 변경 없이 교체할 수 있습니다.

원시 개인 데이터는 렌더러에 전달하지 않고 정규화된 파생 신호만 사용합니다. 외부 시스템은 `virtueme:personal-data` CustomEvent 또는 JSON 파일로 연결할 수 있습니다. 원본 프로젝트는 MIT 라이선스입니다.
