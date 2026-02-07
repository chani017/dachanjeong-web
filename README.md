# [dachanjeong.xyz](http://dachanjeong.xyz)

Next.js(App Router)로 만든 포트폴리오 / 랜딩 페이지입니다.

## 사용 기술

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Vercel Analytics** (선택: Google Analytics는 `NEXT_PUBLIC_GA_MEASUREMENT_ID`로 설정)

## 폴더 구조

```
app/
  page.tsx           # 홈 (클라이언트 컴포넌트)
  layout.tsx         # 루트 레이아웃, 메타데이터, 폰트
  manifest.ts        # PWA 매니페스트
  globals.css        # 전역 스타일 + Tailwind
  components/        # BgCircles, Text, GoogleAnalytics
  hooks/             # useContentScale, useDeviceInfo, useOrientationLock, useDoubleTapRefresh, useTextTiltTouch
lib/
  constants.ts       # PC_BREAKPOINT, PADDING_*
  device.ts          # isMobileDevice()
public/              # 정적 파일 (favicon, link.svg)
```

## 기능 요약

- **BgCircles**: 캔버스 배경의 떠다니는 원 (포인터 반응, 그레인)
- **반응형 스케일**: 뷰포트에 맞게 콘텐츠를 비율 유지한 채 축소
- **모바일**: 가로 모드 시 세로 전용 안내, 더블탭 새로고침, 링크 터치 시 기울임
- **PWA**: `manifest.ts` + layout의 viewport·메타데이터

