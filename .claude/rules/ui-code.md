---
paths:
  - "src/js/screens.js"
  - "src/js/menu-core.js"
  - "src/js/hud-cards.js"
  - "src/js/onboarding.js"
  - "src/js/daily-road.js"
  - "src/js/runmap.js"
  - "src/css/**"
  - "src/body.html"
  - "src/ui/**"
  - "Assets/**/{UI,Ui,ui}/**/*.cs"
  - "Source/**/{UI,Ui,ui}/**/*.{h,cpp}"
---

# UI Code Rules

- UI must NEVER own or directly modify game state — display only, use commands/events to request changes
- All UI text must go through the localization system — no hardcoded user-facing strings
- Support touch first and keyboard second for all interactive elements (this project has no gamepad); touch targets >= 44x44 CSS px
- All text comes from `t(key)` in `src/js/i18n.js` with BOTH `pt` and `en`, kept as short as possible
- All animations must be skippable and respect user motion/accessibility preferences
- UI sounds trigger through the audio event system, not directly
- UI must never block the game thread
- Scalable text and colorblind modes are mandatory, not optional
- Test all screens at minimum and maximum supported resolutions
