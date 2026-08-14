# Merchant Withdrawal Pages Design

## Goal

Add four static prototype pages under the merchant reconciliation feature and connect the specified navigation flow. No withdrawal-related backend API is included in this iteration.

## Scope

- The existing merchant reconciliation page opens the account withdrawal overview from its withdrawal button.
- The account withdrawal overview opens the withdrawal records page, bill details page, and withdrawal form page.
- The four new pages use the copy, values, list content, hierarchy, and visual treatment shown in the supplied prototype images.
- Back navigation uses the existing `back-button` component.
- Static local data drives balances, account details, withdrawal records, and bill detail groups.
- Submitting the withdrawal form does not create a transaction. It only provides local validation or feedback.

## Page Structure

### Account Withdrawal Overview

This is the entry page for the flow. It contains a white custom navigation bar, an orange agreement and balance area, a primary withdrawal button, and a white navigation group for withdrawal records and bill details.

### Withdrawal Records

This page contains a white custom navigation bar, a blue arrival-time notice, and a static list of withdrawal records. Each record shows its destination account, masked account identifier, submitted time, amount, and accepted status.

### Bill Details

This page contains a white custom navigation bar and date-grouped bill entries. Each date header shows total expense and income. Every bill row has a semantic colored icon, description, time, and signed amount.

### Withdrawal Form

This page contains a white custom navigation bar, withdrawal amount input, per-transaction limit, available balance guidance, destination account information, and a bottom withdrawal action. The action is disabled for an empty or invalid amount and uses local feedback only.

## Architecture

Create four focused Vue page components in `src/pages/dashboard/merchant-reconciliation/`. Use `definePage` so the existing pages plugin generates routes automatically. Keep static display data in a small sibling TypeScript module so page templates stay focused and future API replacement has one clear boundary.

The existing reconciliation page receives one navigation handler. Each overview entry uses `uni.navigateTo` with explicit page paths. No store, API client, or persistence changes are required.

## Visual System

- Match the supplied 984 x 2048 mobile prototypes using responsive `rpx` sizing.
- Use a restrained white and light-gray base, orange for withdrawal surfaces and positive bill amounts, blue for the records notice, red for service fees, and green for successful withdrawal status.
- Use the existing Carbon icon utility classes where they reproduce the prototype meaning; use CSS geometry only for simple chevrons and separators.
- Respect safe-area insets and prevent bottom actions or list content from colliding with the device home indicator.

## Interaction And Error Handling

- All specified navigation entries are tappable and preserve the native page stack.
- The withdrawal amount accepts decimal input, enforces the displayed minimum, maximum, and available balance locally, and shows a toast for invalid or simulated submission states.
- Prototype-only controls such as agreement details, account management, date selection, and filtering may provide a local informational toast without navigating to undefined pages.

## Verification

- Add tests for shared route constants, withdrawal amount validation, and static data shape if the existing test harness supports these modules.
- Run targeted tests, TypeScript checking, linting for changed files, and an H5 production build.
- Start the H5 development server and inspect all four pages at mobile and narrow-desktop viewports, including the complete navigation chain and empty/entered withdrawal amount states.
