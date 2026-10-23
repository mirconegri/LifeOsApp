# 📱 LifeOS

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Status](https://img.shields.io/badge/Status-In_Development-orange?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Orion Store](https://img.shields.io/badge/Get_it_on-Orion_Store-8A2BE2?style=for-the-badge)](https://rookieenough.github.io/Orion-Data/redirect.html?id=lifeos)

> 🌐 <a href="https://lifeosapp.mirconegri.com" target="blank">Visit the project website</a>

A personal life management app for Android. One place for university exams, finances, tasks, groceries, goals, notes, and links — everything stored locally on-device, with no account, no backend, and no subscription required.

Built out of frustration with having a different app for every life domain — one for tasks, one for finances, one for university grades — each with its own data model, notification system, and sync requirement. LifeOS consolidates everything into a single local-first app where all data is owned by the user and nothing leaves the device.

## Table of Contents

- [Preview](#preview)
- [Features](#features)
- [Known Issues](#known-issues)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Configuration and Environment](#configuration-and-environment)
- [Roadmap](#roadmap)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Preview

| ![Onboarding](assets/name.png) | ![Degree Setup](assets/uni_selection.png) | ![Priorities](assets/what_matters.png) |
|:--:|:--:|:--:|
| **Onboarding — Your Name** | **Onboarding — Degree Setup** | **Onboarding — What Matters Most** | 

| ![All Set](assets/all_set.png) | ![Home](assets/home.png) | 
|:--:|:--:|
| **Onboarding — All Set** | **Home Dashboard** | 

| ![University](assets/uni.png) | ![Tasks](assets/tasks.png) | 
|:--:|:--:|
| **University and Exams** | **Tasks** *(incl. recurring habits)* |

| ![Finances](assets/finances.png) | ![Statistics](assets/stats.png) | 
|:--:|:--:|
| **Finance Tracker** | **Statistics** |

| ![Modules](assets/modules.png) | ![Settings](assets/settings.png) |
|:--:|:--:|
| **Modules** | **Settings** |

## Features

### Home Dashboard

- Mission Control stat grid: tasks done/total, current balance, weighted average grade, active goals count
- Next exam countdown card
- Pending Tasks — every incomplete task across the app sorted by urgency, not capped to today
- Quick Links grid — up to 6 starred links from the Links section as tappable shortcuts
- Every section header links directly to its full screen via a navigation icon
- Section order is drag-to-reorder and persists across sessions
- First-launch tip bubbles pointing at each section, dismissable

### University and Exams

- Full exam CRUD — add, edit, and delete exams at any status (to start / preparing / passed)
- Exam form requires name, credits (3–15 CFU), and a precise date via a shared calendar picker — future dates only for upcoming exams, past dates within 5 years for passed ones
- Passed exams require an achieved grade; unpassed exams accept an optional expected grade
- Grades use an 18–30L typeahead selector — typing narrows the list (e.g. "3" returns `30` and `30L`)
- Preparing exams show a progress bar that fills as the exam date approaches
- Credits Progress bar showing CFU earned vs. the degree total set at onboarding
- Stat grid: Credits Earned, Exams Passed This Year, Arithmetic Average, Arithmetic Average with expected grades, Weighted Average, Weighted Average with expected grades — the "with expected" boxes auto-hide when no expected grade is entered
- Grade Simulator — enter a hypothetical grade and CFU to preview the effect on both averages before the exam

### Tasks

- Unified task and habit manager in a single Microsoft To Do-style screen
- Sections: Today, Upcoming, Habits, No Date
- Pinned bottom composer for quick entry without opening a modal
- Recurring habits keep a 7-day dot history and streak counter
- Edit any item via a pencil icon
- Drag-to-reorder within each section

### Finances

- Income and expense entries with date, amount, and category
- Date picker with a Today shortcut for quick entry
- Edit transactions via a pencil icon
- Overview stats: balance, total income, total expenses
- 6-month balance bar chart

### Statistics

- Task completion chart — last 7 days
- Grade trend chart — last 8 passed exams in chronological order
- University progress: graduation percentage, weighted average, degree grade projection
- Spending breakdown by category — last 30 days
- Habit streak leaderboard — top 5

### Groceries

- Checklist with category tags: supermarket, pharmacy, home, other
- Filter by all, to buy, or completed

### Goals

- Numeric progress goals with a labeled target and current-progress field
- Inline stepper and direct numeric input
- Priority levels, optional deadline via the shared date picker (5-year cap)
- Editable after creation

### Notes

- Editable title and free-text content
- Tag autocomplete: a dropdown of previously used tags appears while typing and dismisses on confirm — tags become purple chips, keyboard stays open for the next tag
- Tags are single-word and lowercase only

### Links

- Save URLs with a name and emoji icon
- Editable via a pencil icon
- Star up to 6 links to surface them on the Home Quick Links grid

### Onboarding

- First-launch flow: name, degree course, year (1–5), and total credits — selected from common Italian degree credit totals with a custom Other option
- Black splash screen with a centered logo on load

### General

- Fully in English throughout, including all displayed dates
- Every list-based screen includes a Clear All action to wipe demo data and start fresh
- Ships with realistic pre-seeded demo data across every section so the app looks used from first launch

## Known Issues

Open as of the Material 3 Expressive redesign:

- The global search pill is presentational only; working search is a later phase
- Home's task checkbox is nested inside the row pressable — verify the checkbox responds without also opening Tasks on every device
- Drag-to-reorder row heights on the Tasks screen are tuned by eye and may need a device-specific nudge
- `BarChart` replays its grow-in animation whenever its data changes
- Global state is still held in a monolithic `App.js` — the Zustand migration is the first roadmap item
- No automated tests, lint or typecheck scripts yet; the honest gates are `expo-doctor`, `expo install --check` and `expo export`

Resolved by the redesign: the drawer/status-bar overlap, the Android back button closing the app, the Grade Selector tap-to-confirm bug, the composer being covered by the keyboard, and Home's unreliable drag-to-reorder (the dashboard is now a fixed, designed layout).

## Tech Stack

| Dependency | Version | Notes |
|---|---|---|
| React Native | 0.81.5 | |
| React | 19.1.0 | |
| Expo SDK | 54 | |
| react-native-reanimated | 4.1.x | Every animation runs on the UI thread through shared values/worklets |
| react-native-svg | 15.12.1 | Scalloped blob shapes, wavy progress indicators, gradients |
| expo-font + @expo-google-fonts/space-grotesk | 14.0.x / 0.4.x | Space Grotesk 400/500/600/700, loaded behind the first-paint gate |
| expo-haptics | 15.0.8 | Press ticks; lazily required with a `Vibration` fallback for old dev clients |
| expo-blur | 15.0.8 | Still installed but no longer imported: the redesign uses solid tonal surfaces only |
| react-native-safe-area-context | 5.6.x | Edge-to-edge insets for screens, modals and the floating nav |
| react-native-gesture-handler | 2.28.x | Drag-to-reorder gestures on Tasks, Notes and Links |
| lucide-react-native | 1.57.x | Icons, funnelled through `src/components/Icon.js` |
| AsyncStorage | 2.2.0 | Sole persistence layer — SQLite migration is a tracked roadmap item |
| New Architecture | — | `newArchEnabled: true` in `app.config.js` |


## Architecture

All data lives on-device via AsyncStorage under a `lifeos_` key prefix. No backend, no authentication, no network calls at runtime.

### Screens

| Screen | Notes |
|---|---|
| `OnboardingScreen` | First-launch: name, degree, year, credit total; morphing blob hero |
| `HomeScreen` | Focus hero pager, overdue banner, exam rail, task group, quick links, module grid |
| `ModulesScreen` | Secondary modules as a blob grid; Settings and the dev kit live here too |
| `UniScreen` | Credits ring, stat row, grouped exams, Grade Simulator |
| `JournalScreen` | Unified tasks and habits — presented in the UI as Tasks |
| `FinancesScreen` | Balance hero, monthly chart, date-grouped transactions |
| `StatsScreen` | Cross-section analytics, tonal charts, study heatmap |
| `GroceriesScreen` | Shopping checklist |
| `GoalsScreen` | Numeric progress goals |
| `NotesScreen` | Notes with tags |
| `LinksScreen` | Bookmarks with star and reorder |
| `SettingsScreen` | Full-screen modal: module switches, backup export/import, version |


### Key Components

| Component | Purpose |
|---|---|
| `FloatingNav` | Detached M3 nav pill; hides on scroll-down via shared values (the only shadow in the app) |
| `AppScrollView` | Screen-level Reanimated scroll view: safe-area padding, nav reservation, scroll signals |
| `HeroPager` / `HeroCard` | Snapping focus cards with blob drift, scale, dots and timed advance |
| `WavyProgress` | Linear/circular sine progress; at most three animate at once |
| `Blob` / `MorphBlob` | Polar scalloped shapes morphing on the UI thread |
| `GroupItem` | Tonal grouped row with 20/4 corner morphing |
| `SpringPressable` | Press squash + haptic; replaces every `TouchableOpacity` |
| `DraggableList` | Long-press reorder, still used by Tasks, Notes and Links |
| `GradeSelector` | 18–30L grade picker with typeahead and deferred blur |
| `DatePicker` | Shared calendar picker with context-specific date constraints |
| `TagInput` | Chip input with autocomplete against existing Notes tags |
| `Dialog` / `CustomAlert` | Shared dialog primitive; `CustomAlert` keeps its `config` API |
| `BarChart` | Dependency-free tonal bar chart with a slow-spring grow-in |

### Key Patterns

- `localDateKey(d)` — timezone-safe `YYYY-MM-DD` formatter. Avoids `toISOString()`, which converts to UTC before formatting and produces off-by-one date errors in UTC+ timezones including Italy (UTC+1/+2)
- `usePersist(key, setter)` — wraps every state setter so any update auto-saves to AsyncStorage without explicit save calls at each call site
- Tokens, not values — `M3` roles, `MODULE_TONES` tonal pairs and `tonal(hex)` in `src/config/colors.js`; `TEXT` role styles in `src/ui/type.js` (family-per-weight, because Android ignores `fontWeight` with custom fonts); `SHAPE`, `SPACING`, `SPRING` in `src/config/designSystem.js`
- UI-thread motion — scroll position, nav visibility, progress and blob morphs never pass through React state; they are shared values consumed by `useAnimatedStyle` / `useAnimatedProps`
- Reduce Motion — Reanimated's `useReducedMotion()` turns springs into snaps, flattens the wave and disables the hero auto-advance

## Design Decisions

**Why Material 3 Expressive with tonal depth?** The previous look used 1 px hairline borders, card shadows and translucent "glass" to separate surfaces. On Android `BlurView` never actually blurred (it renders as a flat tint before SDK 55), and hairlines read as clutter. The redesign uses M3's tonal surface ladder (`surfaceContainerLow` → `surfaceContainerHighest`), large radii, scalloped shapes and wavy progress instead: depth comes from colour layering, and the only shadow in the app is the floating nav pill. Motion is Reanimated-only, on the UI thread, honouring Reduce Motion.

**Why AsyncStorage instead of SQLite?** AsyncStorage was chosen to minimize native build complexity during the prototyping phase — it requires no native module compilation, works out of the box with Expo Go, and is sufficient for the current data volume (at most a few hundred records per section). The tradeoff is a flat key-value model that makes relational queries verbose. Migrating to `expo-sqlite` is a tracked roadmap item for when the data model stabilizes.

**Why hand-rolled navigation instead of React Navigation?** The screen switcher is still `useState` + `goToScreen` + a history stack for the Android back button, with a floating nav instead of the old drawer. It was built quickly to validate the feature set before committing to an architectural pattern; React Navigation adoption is planned once the Zustand migration is complete, so global state doesn't need to be threaded through a navigation context simultaneously with a persistence refactor.

**Why pre-seed demo data instead of an empty state?** An empty app on first launch creates a poor first impression — every section shows a blank screen with no indication of what it will look like when used. Pre-seeded data with realistic entries communicates the value of each section immediately and lets users evaluate the app before committing to entering their own data. A Clear All action on every screen ensures the demo data is never in the way.

**Why a monolithic `App.js` for global state?** The current approach of holding all screen-level state in `App.js` was the simplest way to share data across screens without a state management library. It is also the biggest architectural liability — 11+ pieces of state in one component means every small update triggers a re-render of the entire tree. The redesign keeps every continuous value (scroll, nav visibility, progress) out of that tree via shared values, but the full fix is the Zustand migration.

## Project Structure

```
LifeOS/
├── App.js                        # Root — screen history, global state, fonts, shell
├── app.config.js                 # Expo config (package: com.mylifeos.app)
├── eas.json                      # EAS Build profiles (preview APK / production AAB)
├── package.json
├── docs/redesign/PLAN.md         # Design audit, decisions and phase log
├── src/
│   ├── config/
│   │   ├── colors.js             # M3 roles, legacy aliases, module tones, tonal()
│   │   ├── designSystem.js       # SPACING, SHAPE, TEXT sizes, SPRING, legacy aliases
│   │   ├── modules.js            # Optional-module switches
│   │   └── nav.js                # Screen registry and floating-nav config
│   ├── data/
│   │   ├── helpers.js            # localDateKey, gradeWeight, calculateAverages, …
│   │   ├── backup.js             # JSON export / import / clear-all
│   │   ├── seedData.js           # Pre-seeded demo data, date-relative and deterministic
│   │   └── storage.js            # loadJSON / saveJSON wrappers around AsyncStorage
│   ├── ui/                       # M3 primitives — FloatingNav, AppScrollView, HeroPager,
│   │                             # WavyProgress, Blob/MorphBlob, GroupItem, Dialog, …
│   ├── components/               # Legacy-shape components now on the new tokens —
│   │                             # Card, StatCard, BarChart, DatePicker, GradeSelector,
│   │                             # TagInput, CustomAlert, DraggableList, FadeSlideIn
│   └── screens/                  # One file per screen — see Architecture table above
└── images/                       # UI screenshots used in this README
```

## Getting Started

### Prerequisites

- Node.js and npm
- [Expo Go](https://expo.dev/go) version 54 or later on an Android device, or an Android emulator
- An Expo account if you intend to use EAS Build

### Installation

```bash
git clone https://github.com/mirconegri/LifeOsApp.git
cd LifeOsApp
npm install
```

## Usage

### Development

```bash
npx expo start -c
```

Scan the QR code with Expo Go on Android. The `-c` flag clears the Metro cache — run with it after any dependency change or if the app hangs on first load.

### Building for internal testing

```bash
eas build --platform android --profile preview
```

Produces an installable `.apk`. The `production` profile targets an `.aab` for Play Store submission — deferred until the architecture items in the Roadmap are addressed.

## Configuration and Environment

No `.env` file and no API keys required. Configuration lives in two files:

| File | Purpose |
|---|---|
| `app.config.js` | Expo metadata — app name, Android package `com.mylifeos.app`, EAS project ID, `newArchEnabled` flag |
| `eas.json` | EAS Build profiles — `preview` (APK) and `production` (App Bundle) |

All user data is persisted via AsyncStorage under keys prefixed with `lifeos_`, entirely on-device.

## Roadmap

The following are explicitly planned and not yet implemented. Play Store publication is intentionally deferred until items 1–3 are addressed:

1. **Migrate global state to Zustand** — remove the 11+ state pieces from `App.js` to eliminate full-tree re-renders on every update
2. **Adopt React Navigation** (Bottom Tabs + Drawer) — replaces the hand-rolled `useState` navigator and fixes the Android back-button issue
3. **Migrate from AsyncStorage to `expo-sqlite`** — enables relational queries at scale; JSON export and import already ship in Settings
4. **Encrypted backups** — the export is plain JSON by design; a password-protected variant would need a key derivation step
5. **Home screen widgets** — quick-add expense, quick-add task, and university status at a glance without opening the app
6. **Ad banners** — once the architecture items above are stable

## Changelog

| Version | Date | Highlights |
|---|---|---|
| `v1.2` | Oct 2026 | Local-first release: Firebase and all cloud sign-in removed, every optional section can be switched off without touching its data, and all data exports to and imports from a readable JSON file |
| `v1.1.2` | Sept 2026 | Drag-to-reorder and Grade Simulator fixes (in progress); drawer safe-area padding adjustments |
| `v1.1.1` | Aug 2026 | Left-side drawer redesign, full English localization, per-screen Clear All action, black splash screen, Study Heatmap removed from Stats |
| `v1.1` | Jul 2026 | Pre-seeded demo data, onboarding credit/year presets with custom Other option, architecture audit — React Navigation / SQLite / cloud-sync roadmap defined |
| `v1.0.4` | Jun 2026 | Microsoft To Do-style Tasks screen, Habits merged into Tasks, Stats replaces Habits in bottom nav, dark visual redesign |
| `v1.0.3` | May 2026 | Goals, Links, Notes, and Habits made editable; tag autocomplete; Study section removed; drag-to-reorder rolled out app-wide |
| `v1.0.2` | Apr 2026 | Calendar exam dates, 18–30L grade picker, working exam Edit, Grade Simulator, shared date picker, mandatory field validation |
| `v1.0.1` | Apr 2026 | Exam progress bar, CFU fields, Credits Progress bar, drawer safe-area fix, Links text-visibility fix |
| `v1.0` | Mar 2026 | Onboarding flow, study timer removed, Quick Links widget on Home, custom delete dialogs, first-launch tips |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with a clear message
4. Open a Pull Request

For bugs or feature ideas, open an [Issue](https://github.com/mirconegri/LifeOsApp/issues).

### Author

**Mirco Negri** — Computer Science @ UniTrento

[![Portfolio](https://img.shields.io/badge/Portfolio-00599C?style=for-the-badge&logo=globe&logoColor=white)](https://mirconegri.github.io/Portfolio/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mirconegri)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mirco-negri-263810225)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mirconegri06@gmail.com)

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
