# LifeOS → Orion Store 2.0 (M3 Expressive) — Redesign plan

Status: approved by the project owner on 2026-10-19. This is the durable plan for every phase; when in doubt, this file wins over chat memory.

- Branch: `redesign/m3-expressive` (created from `main` @ `4e6e012`, the approved source of truth).
- Reference material: the original task prompt and four Orion Store 2.0 contact sheets (Home, rails, My Apps list, detail + download). They live outside this repo and are never committed.
- Validation reality: no tests, no lint, no typecheck scripts. The honest gates are `npx expo-doctor`, `npx expo install --check`, and `npx expo export --platform android --output-dir "$env:TEMP\lifeos-export"`. Lint/typecheck/tests are reported as N/A. Do not add ESLint/Prettier/Jest.

## 1. Locked decisions

1. **Target tree.** This checkout (`main` @ `4e6e012`, package version 1.1.0) is the source of truth. It is 28 commits *ahead* of the snapshot named in the original prompt (`c869bed`, "v1.8.1"); `c869bed` is an ancestor. Tags in this repository are not ordered by history and must not be used to infer versions.
2. **Primary identity: A — pastel M3.** Filled buttons use `primary` `#cabeff` with `onPrimary` `#32285f`; text/icons accented in `primary`. Do not fall back to saturated violet fills.
3. **`brag-output/`** is a local recording-tool workspace. It is added to `.gitignore` and kept on disk; it is never deleted and never committed.
4. **Settings entry.** The drawer is removed in Phase 2. Settings (backup export/import, delete-all, module switches, runtime version) is reached from the avatar in the `SearchPill` on Home, and from a Settings row on the new `modules` screen. It stays an opaque full-screen modal.
5. No push, no `eas build`, no branch deletion, no `assets/` edits, no storage-key changes. Secrets never committed.
6. Every existing component keeps its public props (`Card`, `Pill`, `StatCard`, `CustomAlert` `config`, `DatePicker`, `GradeSelector`, `TagInput`, `TipBubble`, `DraggableList`, …). Only internals are restyled.
7. New dependencies allowed: `expo-font` + `@expo-google-fonts/space-grotesk` only. Gradients use `react-native-svg` `LinearGradient`. No Skia, Moti, NativeWind, Paper, Lottie, navigation library, Zustand, SQLite.
8. Code, comments, identifiers, UI strings: English. Persisted documents also English.

## 2. Ground truth in this tree

- Expo SDK 54, React Native 0.81.5, React 19.1, `newArchEnabled`, dark-only (`userInterfaceStyle: "dark"`), Android-first (Nothing Phone 2a, 120 Hz). Animations must run on the UI thread.
- Installed and usable: `react-native-reanimated ~4.1.1`, `react-native-worklets 0.5.1`, `react-native-svg 15.12.1`, `react-native-gesture-handler`, `react-native-safe-area-context`, `lucide-react-native`, `expo-blur`, `expo-haptics ~15.0.8`, `expo-constants`, `expo-dev-client`. `expo-font` is only nested at `node_modules/expo/node_modules/expo-font`; it must be installed at the root.
- Only `DraggableList` uses Reanimated today. FadeSlideIn, TipBubble, the drawer and the tab-icon pop use legacy `Animated`.
- `@react-navigation/*` is in `package.json` and imported nowhere. Untouched.
- Navigation is hand-rolled: `screen` state + `goToScreen` + `screenHistoryRef` + `BackHandler` in `App.js`; `NAV` in `src/config/nav.js` (9 entries, 5 `bottomNav: true`); a 240 px drawer `Modal`; a 52 px top bar; `<FadeSlideIn key={screen}>` for screen switches.
- Optional modules: `src/config/modules.js` (`MODULES`, `DEFAULT_MODULES`, `normalizeModules`); Home and Stats are always on; switching a module off never touches its data.
- `SettingsScreen` (added after the original prompt snapshot): module switches, backup export/import/merge/replace, delete-all, version from `expo-constants`.
- Tokens today: `src/config/colors.js` (`COLORS`, bg `#0b0b12`, accent `#7c5cff`, hairline borders), `src/config/designSystem.js` (`SPACING`, `TYPE`, `ELEVATION`, `MOTION`, `RADIUS`).
- Eight full-screen modals (six forms + Uni + Settings) use `statusBarTranslucent` + `navigationBarTranslucent` and compute `useSafeAreaInsets()` themselves.
- `HomeScreen` receives `timerProps` and never uses them; no timer UI exists anywhere.
- Global state is monolithic `App.js` with props drilling; AsyncStorage keys are `lifeos_*`.

### 2.1 Audit counts (re-verified)

| Metric | Value |
|---|---|
| `<TouchableOpacity` JSX openings | 109 in 17 files (218 tags) |
| `COLORS.accent` references | 100 |
| `borderWidth: 1` / `1.5` | 46 |
| accent used as background | 19 (18 are filled controls with white foreground) |
| live `BlurView` importers | 2 (`CustomAlert`, `DatePicker`); `GlassSheet` is dead (zero importers) |
| `DraggableList` users | Home, Journal, Notes, Links |
| ScrollViews | 23 in `src/` + drawer = 24 |
| `keyboardShouldPersistTaps="handled"` | exactly 7 (six form modals + Uni edit modal) — all become `"always"` |
| `keyboardShouldPersistTaps="always"` | 6 |
| full-screen modals | 8 |
| custom font | none |
| Reanimated users | `DraggableList` only |

Per-file `TouchableOpacity`: Journal 16, Goals 13, Finances 10, Links 10, Groceries 9, DatePicker 8, Uni 8, Notes 8, Onboarding 7, App 5, Home 4, Settings 4, GradeSelector 2, TagInput 2, CustomAlert 1, Pill 1, TipBubble 1.

Current bottom padding of scroll content: Home 100, Finances 32, Goals 40, Groceries 32, Journal 12, Links 40, Notes 40, Onboarding 40, Settings 40, Stats 40, Uni 40; modal scrolls 32–40. With the floating nav every screen needs `64 + 12 + insets.bottom + 16`.

### 2.2 Accent-on-white pairs to fix in Phase 1

`CustomAlert` 120/134 · `DatePicker` 289/293 · `TipBubble` 64/78/90 · `FinancesScreen` 386/387 · `GoalsScreen` 376/377 and 424/425 · `GroceriesScreen` 206/207 and 241/242 · `JournalScreen` 546/547, 576/577, 594/595 · `LinksScreen` 264/265 and 299/300 · `NotesScreen` 252/253 and 278/279 · `OnboardingScreen` 293/299 and 384/390 · `UniScreen` 630/631.

Fix: filled controls become `primary` background with `onPrimary` foreground; destructive stays `errorContainer`/`onErrorContainer`. The one remaining accent fill is a dot indicator.

## 3. Design tokens to create (Phase 1)

`src/config/colors.js`:

```js
export const M3 = {
  background: '#0E0E12', surface: '#0E0E12',
  surfaceContainerLowest: '#000000', surfaceContainerLow: '#131318',
  surfaceContainer: '#191920', surfaceContainerHigh: '#1F1F26', surfaceContainerHighest: '#25252E',
  surfaceBright: '#2C2B34',
  onSurface: '#E7E4F0', onSurfaceVariant: '#ACAAB5', outline: '#76747F', outlineVariant: '#484750',
  primary: '#cabeff', onPrimary: '#32285f', primaryContainer: '#483f77', onPrimaryContainer: '#e6deff',
  secondary: '#c9c3dc', onSecondary: '#312e41', secondaryContainer: '#484459', onSecondaryContainer: '#e6dff9',
  tertiary: '#edb8cc', onTertiary: '#492535', tertiaryContainer: '#623b4c', onTertiaryContainer: '#ffd8e6',
  error: '#ffb4ab', onError: '#690005', errorContainer: '#93000a', onErrorContainer: '#ffdad6',
  scrim: '#000000',
};
```

Legacy aliases (same keys, new values) so unmigrated screens inherit the palette. The alias map must be *complete* — a missing key renders `undefined`:

| legacy | value |
|---|---|
| `bg` | `background` |
| `bg2` | `surfaceContainerLow` |
| `bg3` | `surfaceContainer` |
| `bg4` | `surfaceContainerHigh` |
| `bgElevated` | `surfaceContainer` |
| `text` | `onSurface` |
| `textMuted` | `onSurfaceVariant` |
| `textSub` | `outline` |
| `accent` | `primary` |
| `accentDim` | `primaryContainer` |
| `accentGlow` | `#cabeff26` (primary @ 15%, legacy tint only) |
| `accent2` | `#acdff6` (stats tone-on) |
| `accent2Dim` | `#17536e` (stats container) |
| `green` | `#b1f1c9` (journal on) |
| `greenDim` | `#22633a` (journal container) |
| `amber` | `#f6dbac` (finances on) |
| `amberDim` | `#6d4d18` (finances container) |
| `red` | `#ffb4ab` (error) |
| `redDim` | `#93000a` (errorContainer) |
| `blue` | `#acc8f6` (links on) |
| `surface` | `#ffffff08` (unchanged) |
| `border` | `outlineVariant` |
| `border2` | `outline` |
| `hairline` | `outlineVariant` (deprecated) |

Per-module tonal pairs (container / on):

| module | base | container | on |
|---|---|---|---|
| home / uni | `#7c5cff` | `#261471` | `#bbacf6` |
| journal (Tasks) | `#22c55e` | `#22633a` | `#b1f1c9` |
| finances | `#f59e0b` | `#6d4d18` | `#f6dbac` |
| stats | `#5ac8fa` | `#17536e` | `#acdff6` |
| groceries | `#fb923c` | `#6f3e16` | `#f6cdac` |
| goals | `#f43f5e` | `#6c1927` | `#f6acb9` |
| notes | `#eab308` | `#6e5917` | `#f6e4ac` |
| links | `#3b82f6` | `#18386d` | `#acc8f6` |

Export `tonal(hex)` implementing `container = hsl(h, min(s*.7, .75), .26)`, `on = hsl(h, min(s, .8), .82)`. Positive/negative money and status colours come only from these pairs, never raw green/red on text.

`SHAPE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 28, full: 999 }`.
Rows: outer 20/24, inner 4, gap 2 · hero/tall cards/dialog/sheet 28 · banner 24 · inputs 16 · chips/buttons/nav full.

Type: **Space Grotesk** (400/500/600/700) via `expo-font` + `@expo-google-fonts/space-grotesk`. Android ignores `fontWeight` with custom fonts: ship family-per-weight style objects (`SpaceGrotesk_400Regular`, `_500Medium`, `_600SemiBold`, `_700Bold`); no `Text.defaultProps` hacks. Roles: headlineLarge 32/40/400, headlineMedium 28/36/400, headlineSmall 24/32/400, titleLarge 22/28/400 (emphasized 500), titleMedium 16/24/500 ls .15, titleSmall 14/20/500 ls .1, bodyLarge 16/24/400 ls .5, bodyMedium 14/20/400 ls .25, bodySmall 12/16/400 ls .4, labelLarge 14/20/500 ls .1, labelMedium 12/16/500 ls .5, labelSmall 11/16/500 ls .5. Emphasized 600/700 only for selected states and primary actions. Keep `SPACING`; keep legacy `TYPE`/`ELEVATION`/`MOTION`/`RADIUS` aliases.

Motion (Reanimated springs, mass 1; tune on device):

```js
export const SPRING = {
  fastSpatial:    { mass: 1, stiffness: 800,  damping: 34  },
  defaultSpatial: { mass: 1, stiffness: 380,  damping: 31  },
  slowSpatial:    { mass: 1, stiffness: 200,  damping: 23  },
  fastEffects:    { mass: 1, stiffness: 3800, damping: 123 },
  defaultEffects: { mass: 1, stiffness: 1600, damping: 80  },
  slowEffects:    { mass: 1, stiffness: 800,  damping: 57  },
};
```

Constants: press scale `.94`; reveal translateY 28, delay `index*45 ms`, `index <= 8`; hero auto-advance 5500 ms; nav hide translateY 120; nav icon pop `.7 -> 1`; dot width 6 ↔ 22; row corner 20 ↔ 4.

## 4. Primitives (`src/ui/`, Phase 1)

1. `SpringPressable` — squash to `.94` (fast spatial), Android ripple clipped to radius, haptic `selection`/`medium`/false. Replaces `TouchableOpacity`.
2. `Reveal({index})` — rise 28 + fade, once per item, first ~9 only; re-implement `FadeSlideIn`; also used for screen fade-through.
3. `Blob` / `MorphBlob` — radial `r(θ) = R*(1 + a*sign(c)*|c|^p)`, `c = cos(nθ)`, sampled; presets: circle (1,0,1), cookie6 (6,.075,1), cookie9 (9,.06,1), cookie12 (12,.045,1), clover4 (4,.17,1), flower (8,.13,1), sunny (8,.11,.55). Morph = lerp sampled radii driven by a shared value through `useAnimatedProps`; 72 samples, precomputed unit tables; crossfade fallback if frame drops.
4. `WavyProgress` — `variant: 'linear'|'circular'`, `progress 0–1|undefined` (indeterminate), `color`, `trackColor`, `amplitude ≈ 3`, `wavelength ≈ 24`, `stroke 4–6`, `animate`. Sine phase scrolls; amplitude flattens near 0/100 %; remainder is a straight track. At most 3 animated at once (module-level counter; later instances render static/frozen).
5. `FloatingNav` + `AppScrollView` — `AppScrollView` is a Reanimated ScrollView writing scroll direction to a shared value (never state), `keyboardShouldPersistTaps="always"`, bottom pad `64 + 12 + insets.bottom + 16`, top inset inside content. `FloatingNav` implements S9 for the 5 `bottomNav: true` items.
6. `ScreenHeader`, `SearchPill`, `SectionTitle`, `HeroPager`/`HeroCard`, `GroupItem` + `rowShape(i,n)` (20/4 corners), `TonalIcon`, `StatRow`, `Chip`, `IconButton` (40 tonal circle → radius 14 pressed), `CtaButton` (56, full round, pressed radius 28→14 + scale .97, `loading`), `EmptyState` (96 cookie9 + icon + title + body), `Dialog` (radius 28, `surfaceContainerHigh`, padding 24, scrim ~70 %; keeps `CustomAlert`'s `config` API).
7. Dev-only kit screen (`__DEV__`, long-press the header brand mark): every primitive and every blob preset.

`Reduce Motion` (`AccessibilityInfo` / Reanimated `useReducedMotion`): springs → instant, wave amplitude → 0, hero auto-advance off.

## 5. Screen mapping

- **Shell.** Remove the 52 px top bar and the drawer. `FloatingNav`: Home · University · Tasks · Finances · Stats. Secondary modules (Groceries, Goals, Notes, Links) live on a presentational `modules` screen (3-column blob grid + counts + Settings row) opened from the header brand mark and from the "Browse modules" rail on Home. `goToScreen` / `screenHistoryRef` / `BackHandler` behaviour unchanged. The `modules` screen id is not in `NAV`: special-case it in `App.js` render, keep it out of the `modules[screen] === false` guard, and rename the state to `enabledModules` internally to avoid the collision.
- **Home.** 1. SearchPill (brand → modules, avatar → Settings, placeholder "Search LifeOS") + date/course row. 2. HeroPager "Focus" with only cards that have data: next exam (uni hue), tasks today (journal hue, circular wavy), balance (finances hue), study days (stats hue); tap → module. 3. Smart banner "N overdue tasks · Review" (hidden when 0). 4. "Up next": tall tonal cards for next ≤ 6 active exams, EmptyState if none. 5. "Tasks": SectionTitle + arrow + GroupItem list of the existing top-6 urgency logic, springy 24 checkbox, tonal priority, overdue in `error` with icon, "+N more" last row. 6. "Quick links": icon-first tiles (user emoji inside a 56 tile). 7. "Browse modules": blob tiles with counts. 8. TipBubble restyled as an `inverseSurface` snackbar above the nav. Remove `DraggableList` from Home; keep the section-order storage key unread, never delete it.
- **University.** StatRow (credits earned, average, predicted degree grade), large circular WavyProgress (credits / totalCredits), exams as grouped rows with status chips (passed → journal tone, preparing → uni tone, to start → neutral), form restyle keeping `GradeSelector` logic.
- **Tasks (`journal`).** Chip-row filters, grouped lists, springy checkbox, habit streak chips; composer above the floating nav; no logic changes.
- **Finances.** Balance hero (finances container), income/expense StatRow, transactions grouped by date with GroupItem, amounts from tonal pairs.
- **Stats.** Fully-round-top bars on a tonal track with slow-spring grow-in; ProgressRing → circular WavyProgress (static where > 3); heatmap as a tonal `primary` ramp.
- **Groceries / Goals / Notes / Links.** Grouped lists in module tones; goal progress as linear WavyProgress under the 3-animated cap.
- **Onboarding.** MorphBlob hero (morph + quarter turn per step), pill dot indicators, bottom CtaButton.
- **Forms (full-screen modals).** 40 circular tonal close button + titleLarge; filled `surfaceContainerHigh` fields radius 16, 56 high, no border, label above; sticky bottom CtaButton (+ tonal secondary, `errorContainer` for destructive); default spatial slide-up over a scrim. Never bottom sheets or blur.
- **Global.** Depth from tonal layering, not borders: no 1 px hairlines on cards/rows; the only shadow in the app is the FloatingNav.

## 6. Phases

Each phase: small Conventional Commits, annotated tag `redesign-phase-N`, phase report (changed files, on-device checklist, gaps, EAS verdict, commands), no push / no EAS build.

### Phase 0 — audit & plan (commit + tag)
- Branch `redesign/m3-expressive`; this file; `.gitignore` += `brag-output/`.
- No code gate; report.

### Phase 1 — Foundations (visible change ≈ palette + contrast only)
- Tokens: M3 roles + complete legacy aliases + `tonal()` + module tones; `SHAPE`, type roles, `SPRING`; keep legacy keys.
- `npx expo install expo-font @expo-google-fonts/space-grotesk`; fonts gate joined to `App.js`'s existing `ready` blank view (no system-font flash).
- Defensive haptics wrapper (lazy require, `Vibration` fallback — same pattern as DraggableList).
- All primitives of §4 with props contracts and Reanimated-only motion; dev kit screen.
- Reduce Motion honoured.
- Fix the 18 accent-on-white pairs; restyle `Card`/`Pill`/`StatCard`/`FadeSlideIn` internals on the new tokens (public props unchanged).
- Gate: `expo-doctor` → `expo install --check` → `expo export` → greps → tag `redesign-phase-1`.

### Phase 2 — Shell
- Remove top bar + drawer (state, animation, styles, BackHandler branch); remove legacy tab-icon pop.
- `FloatingNav` with shared-value scroll hide/show, label expansion, icon pop, badges.
- `AppScrollView` in all screens; bottom pad 64+12+inset+16; `keyboardShouldPersistTaps="always"`; top inset inside content.
- `ScreenHeader` on non-Home screens; SearchPill + chip row on Home (brand → modules, avatar → Settings) so both entries survive.
- New `modules` screen; `App.js` render case; BackHandler parity.
- Fade-through via `Reveal`; update DraggableList `EDGE_TOP`/`EDGE_BOTTOM`.
- EAS: JS-only expected.

### Phase 3 — Home
Full Home per §5, `DraggableList` removed from Home only, hero pager auto-advance paused while dragging and off under Reduce Motion, TipBubble snackbar.

### Phase 4a — University + Tasks
Uni and Journal per §5.

### Phase 4b — Finances + Stats
Finances and Stats per §5.

### Phase 5 — Long tail + cleanup
Groceries / Goals / Notes / Links; Onboarding; remaining forms; `Dialog`, `DatePicker`, `TipBubble`, `TagInput`; delete `GlassSheet`, unused `BlurView` imports, legacy `Animated`; keep `DraggableList` (still used on Journal/Notes/Links); README tech stack + design section; final sweeps for `TouchableOpacity`, `borderWidth: 1`, raw hex, `keyboardShouldPersistTaps`.

### Phase 6 — optional, ask first
Live search in the pill; timer CTA morphing into a wavy progress pill (state exists, UI does not); card→detail shared element (experimental).

## 7. Risks

- SVG path morph in a worklet is a likely frame-budget risk on a 120 Hz device → 72 samples, precomputed tables, crossfade fallback, measured in the dev kit.
- Hero pager nested in a vertical scroll view → horizontal snap list, drag flag only, no per-frame JS.
- `App.js` still re-renders on `screen`/data changes → nothing continuous may pass through React state; nav visibility/scroll/progress live in shared values. Full root-state fix is the separate Zustand roadmap item.
- Android ignores `fontWeight` with custom fonts → family-per-weight style objects only.
- `expo-doctor` is not installed → `npx` fetches it; if the network blocks it, report the gate unavailable, never a silent pass.
- Journal composer / tip / floating nav collisions need explicit on-device checks.

## 8. Reporting contract

At the end of every phase: changed files, what to check on the phone (checklist), known gaps, EAS rebuild yes/no, and the commands to run (`npm install` / `npx expo install …`, `npx expo start -c`). Device checks are the real acceptance; the gates only prove bundling and configuration.

## 9. Acceptance checklist (owner verifies on device)

- No `TouchableOpacity` left in restyled screens; every tap squashes + ticks.
- No hairline borders on cards/rows; the only shadow is the nav pill.
- No raw hex in screens (tokens only); text contrast ≥ 4.5:1; no white-on-pastel buttons.
- Scrolling does not re-render `App.js`; nav hide/show uses shared values; wavy ≤ 3 animated; steady 120 fps feel.
- Reduce Motion honoured.
- Nav hides on scroll-down, returns on scroll-up/at top; nothing hidden behind it; Android back works; keyboard never covers a field; modals respect insets.
- Storage-key diff = ∅; seed data untouched; `journal` id intact.
- Fonts load before first paint.
- Home matches S1–S8 in structure and feel; detail-style headers where a detail view exists.

## 10. Progress log

- **Phase 0 — done** (`redesign-phase-0`): branch created; this plan; `brag-output/` ignored. Owner approved the plan and locked decisions A / avatar / ignore.
- **Phase 1 — done** (`redesign-phase-1`): M3 tokens + complete legacy alias map + `tonal()` (matches the precomputed table exactly), Space Grotesk behind the existing ready gate, defensive haptics wrapper, 20 primitives in `src/ui/` (SpringPressable, Reveal, Blob/MorphBlob, WavyProgress, AppScrollView, ScrollProvider, FloatingNav, ScreenHeader, SearchPill, SectionTitle, HeroPager/HeroCard, GroupItem, TonalIcon, StatRow, Chip, IconButton, CtaButton, EmptyState, Dialog), dev kit behind a wordmark long-press, legacy Card/Pill/StatCard/FadeSlideIn restyled, and all 18 accent-on-white pairs fixed. Gates: `expo-doctor` 18/18, `expo install --check` clean, `expo export` bundles 3093 modules / 5 font assets. No push, no EAS build.
- **Phase 2 — done** (`redesign-phase-2`): top bar, drawer, legacy bottom nav and tab-icon pop removed; `ScrollProvider` + `FloatingNav` wired; every screen-level ScrollView is `AppScrollView` (top/bottom insets, `keyboardShouldPersistTaps="always"`, shared scroll signals); Home gained the SearchPill header (brand → modules, avatar → Settings, long-press → dev kit); new `modules` screen (blob grid, counts, Settings/Dev kit rows); all 7 `"handled"` modal scrolls fixed; Journal composer lifted above the nav; DraggableList edge bands retuned. `modules` is a screen id, not a module flag.
- **Phase 3 — done** (`redesign-phase-3`): Home rebuilt as the focus dashboard — SearchPill + date/course row, HeroPager (next exam, tasks today with a circular wavy accessory, balance, study days; only cards with data), overdue smart banner, tall tonal exam rail (`UpNextCard`, ≤ 6, EmptyState when none), grouped task list with springy 24 checkboxes / tonal priority pills / error overdue status / "+N more" last row, icon-first quick-link tiles, module blob grid with counts, and an inverse-surface TipBubble above the nav. `DraggableList` and the 2×2 dashboard grid are gone from Home; the `lifeos_home_section_order` key is unread but still backed up (data untouched). App.js now passes `moduleCounts` and `onToggleTask` to Home.
- **Phase 4a — done** (`redesign-phase-4a`): **University** — `ScreenHeader`, credits ring (circular `WavyProgress` with % in the centre) + three-column `StatRow`, grouped exam rows (`GroupItem`: status tone, grade, prep % / days left), restyled simulator, filled 56-high form fields with labels above, status `Chip`s, circular close `IconButton` and `CtaButton` footer; `GradeSelector` deferred-blur logic untouched. **Tasks** — `ScreenHeader` with today counter + Clear all, grouped task rows with springy 24 checkboxes, tonal priority `Pill`, trash icon button, habit cards (icon tile, streak chip, seven tappable day circles), composer restyled above the nav. No `TouchableOpacity`, `COLORS.*` or hairlines left in either screen. Deviation: no chip-row *filters* were added — the current tree has no filter logic and the phase brief says "no logic changes".
- **Phase 4b — next**: Finances + Stats.

