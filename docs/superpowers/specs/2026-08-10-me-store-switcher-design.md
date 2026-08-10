# Me Store Switcher Design

## Scope

Add a tap target beside the current store name on the Me page. It displays a black down-arrow image and opens the existing `store-access-scope` bottom sheet.

## Behavior

- Opening the sheet selects the current store.
- Confirming a store reuses the merchant store selection behavior from login. The current store updates, the profile reloads, and the Me header reflects the selected store name and status.
- Selecting a store with an incomplete-access state follows the existing lock-page route.
- "Open new store" reuses the login page's draft-store creation and lock-page navigation rules.
- Repeated taps while a new store is being prepared are ignored. Failures remain user-visible through the existing toast pattern.

## UI

- Replace the supplied arrow asset with a compact black downward chevron.
- Keep the existing `store-access-scope` component and its close, selection, and actions unchanged so login and Me use the same sheet.

## Validation

- Type-check the store app after the changes.
- Inspect the modified Vue file and asset metadata to confirm imports, event bindings, and image replacement are valid.
