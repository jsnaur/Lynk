Lynk is a modern, high-performance campus helper platform. It transforms the traditional static profile page into a dynamic, interactive "Quest" hub where users can engage with content, complete tasks, and earn rewards.

## Features

  - **Gamified Profiles:** Every profile acts as a dashboard featuring interactive avatars, earned badges, and XP tracking.
  - **Quest System:** Create and display "Quests" (tasks or links) that users can interact with to gain XP and tokens.
  - **In-App Shop:** Spend earned tokens on profile customizations, such as new avatars and rarity-based badges.

## Tech Stack

| Layer            | Technology                                    | Purpose / Usage                                                 |
| ---------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Frontend         | [React Native](https://reactnative.dev/)      | Mobile app framework for iOS and Android                        |
|                  | [Expo](https://expo.dev/)                     | Development environment, build & deployment tools               |
|                  | [TypeScript](https://www.typescriptlang.org/) | Type safety and better code structure                           |
|                  | [React Navigation](https://reactnavigation.org/)| Bottom tabs and native stack navigation                       |
| Styling          | SCSS & Linear Gradients                       | Dynamic custom styling and themed visuals                       |
| Database & Auth  | [Supabase](https://supabase.com/)             | PostgreSQL, authentication, and real-time database updates      |

## Prerequisites

| Category         | Tool / Technology         | Purpose / Notes / Installation                                   |
| ---------------- | ------------------------- | ---------------------------------------------------------------- |
| System           | Windows / macOS / Linux   | Standard OS for mobile development.                              |
| Node.js          | Node.js                   | JavaScript runtime for React Native & Expo. v18+ recommended.    |
| Package Manager  | npm                       | npm comes with Node.js.                                          |
| Expo CLI         | Expo CLI / Expo Go        | For running and building React Native apps, testing on physical devices. |

## Cloning and Initialization

**Step 1:** Clone the repository

```bash
  git clone https://github.com/jsnaur/lynk.git
```

**Step 2:** Navigate into the project folder

```bash
  cd lynk
```

**Step 3:** Install dependencies

```bash
  npm install
```

**Step 4:** Set up your environment variables
Create a `.env` file in the root directory and add your Supabase credentials:

```bash
  EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Run Locally

**Step 1:** Start the Expo development server

```bash
  npm start
```

**Step 2:** Choose your development environment

  - Press `a` in the terminal to open the app on an Android emulator.
  - Press `i` to open on an iOS simulator.
  - Scan the QR code with the **Expo Go** app on your physical mobile device.

## Developer Profiles

  - **Jesnar T. Tindogan** \<\< Project Manager | Backend \>\>

    [](https://github.com/jsnaur)

  - **Aldrich A. Segura** \<\< Fullstack \>\>

    [](https://github.com/aldrich-star)

  - **Karl Jovanne S. Claudio** \<\< Backend & QA tester \>\>

    [](https://github.com/Jobanned)

  - **Mark Lawrence G. Amatong** \<\< Fullstack \>\>

    [](https://github.com/markuu-exe)

