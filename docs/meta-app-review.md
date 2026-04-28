# Meta App Review submission notes

Reference: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

## Use case summary

0001.dev is a personal tools suite operated by a sole proprietor in Tokyo, Japan. The app uses the Meta Graph API to `[TODO: permission or feature, for example publish content, read connected assets, or manage messages]` in order to `[TODO: concrete user benefit]`.

## Data deletion statement

User data can be deleted at any time via `https://0001.dev/data-deletion`. Deletion is processed within 24 hours. Meta data deletion callbacks are handled at `https://0001.dev/api/meta/data-deletion` per Meta's `signed_request` spec. The callback returns `{ "url": "https://0001.dev/data-deletion?code=...", "confirmation_code": "..." }` and queues the request in Convex.

## Permissions

Duplicate this block for each permission requested in App Review.

### `[TODO: permission name]`

This permission is used on `[TODO: exact screen or feature name]`. The app calls `[TODO: exact Graph API endpoint and method]` when the user `[TODO: exact user action]`. The app reads or writes `[TODO: exact fields or content]` and uses it to `[TODO: concrete user benefit]`. If the user denies this permission, `[TODO: exact degraded behavior]`; the app does not call this endpoint and the related feature remains unavailable.

## Reviewer instructions

1. Open `https://0001.dev`.
2. Sign in with the test user below.
3. Go to `[TODO: exact screen]`.
4. Click `[TODO: exact button]` to start Meta OAuth.
5. Approve the requested permissions.
6. Return to the app and verify `[TODO: expected result]`.
7. Trigger each reviewed feature in this order:
   - `[TODO: feature 1 and expected Graph API endpoint]`
   - `[TODO: feature 2 and expected Graph API endpoint]`
8. Open `https://0001.dev/data-deletion` to confirm the public deletion instructions.

## Test user credentials

```text
Email: [TODO: Meta reviewer test user email]
Password: [TODO: Meta reviewer test user password]
Two-factor notes: [TODO or "Not required"]
Meta test user: [TODO: Meta test user name or ID]
```

## Business identity

- Legal name: ヨアキム セレンセン
- Trade name: イチ
- Address: 〒114-0022 東京都北区王子本町2丁目15-7
- Contact: joachim@0001.dev
- Website: https://0001.dev

## Public URLs

- Privacy policy: https://0001.dev/privacy
- Terms of service: https://0001.dev/terms
- Data deletion instructions: https://0001.dev/data-deletion
- Meta data deletion callback: https://0001.dev/api/meta/data-deletion
- 特定商取引法に基づく表記: https://0001.dev/tokushoho
