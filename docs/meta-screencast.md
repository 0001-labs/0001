# Meta App Review screencast script

Target length: 3-5 minutes.

Recording URL placeholder: `[Paste Loom URL here]`

## Before recording

- Use a test user account created for Meta App Review.
- Keep the browser on `https://0001.dev`.
- Keep DevTools Network open only if it helps show the Graph API calls clearly.
- Replace every `[TODO: ...]` placeholder before submitting.

## 0:00-0:20 — Introduction

Screen: `https://0001.dev`

Narration:

> This is 0001.dev, a personal tools suite operated by a sole proprietor in Tokyo, Japan. In this walkthrough I will show the Meta login flow, each Meta Graph API endpoint used by the app, where the user sees the feature, how data is stored, and how a user can request deletion.

## 0:20-0:55 — Meta OAuth login

Screen: `[TODO: exact app screen where Meta login starts]`

Capture cues:

- Show the user clicking the Meta login or connect button.
- Show the Meta OAuth consent screen.
- Show the requested permissions.
- Return to the app after consent.

Narration:

> I start by connecting a Meta account from this screen. The app redirects the user to Meta OAuth and requests only the permissions needed for the feature being reviewed. If the user denies the permission, this feature remains unavailable and the app does not call the related Graph API endpoint.

## 0:55-2:20 — Graph API endpoint walkthrough

Screen: `[TODO: user-facing feature screen for endpoint 1]`

Narration:

> Endpoint 1 is `[TODO: Graph API endpoint, for example GET /me/accounts]`. This is called when `[TODO: user action]`. The app reads `[TODO: exact fields]` and uses them to `[TODO: user benefit]`. The data is shown here on screen.

Screen: `[TODO: user-facing feature screen for endpoint 2]`

Narration:

> Endpoint 2 is `[TODO: Graph API endpoint]`. This is called when `[TODO: user action]`. The app reads or writes `[TODO: exact fields]` so the user can `[TODO: user benefit]`.

Screen: `[TODO: add more screens as needed]`

Narration:

> The same pattern applies to each additional endpoint: the user triggers the feature, the app calls the documented Graph API endpoint, and the response is used only for the visible product workflow.

## 2:20-3:05 — Data storage

Screen: repository or internal admin view showing `convex/schema.ts`

Narration:

> User data is stored in Convex. The relevant schema is in `convex/schema.ts`. For this generic 0001.dev review package, Meta deletion requests are queued in the `dataDeletionRequests` table with a confirmation code, Meta app-scoped user ID, source, status, and timestamps. App-specific Meta data should be documented here before final submission: `[TODO: list app tables and fields that store Meta-derived data]`.

## 3:05-3:45 — Data deletion

Screen: `https://0001.dev/data-deletion`

Capture cues:

- Show the public instructions page.
- Show the callback URL text: `https://0001.dev/api/meta/data-deletion`.

Narration:

> Users can request deletion at any time from `/data-deletion` or by emailing `joachim@0001.dev`. Meta app-removal callbacks are handled at `/api/meta/data-deletion`. The callback verifies Meta's signed request, queues a deletion job in Convex, and returns a status URL with a confirmation code. Valid deletion requests are processed within 24 hours.

## 3:45-4:15 — Close

Screen: `[TODO: return to the reviewed feature]`

Narration:

> This completes the review flow. The app asks for each permission only for the visible feature shown in this recording, uses the Graph API data only for that feature, and gives users a public deletion path at `https://0001.dev/data-deletion`.

## Endpoint checklist

Fill this table before submission.

| Order | Permission | Graph API endpoint | Method | User-facing screen | Data read or written | Denial behavior |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `[TODO]` | `[TODO]` | `[TODO]` | `[TODO]` | `[TODO]` | `[TODO]` |
| 2 | `[TODO]` | `[TODO]` | `[TODO]` | `[TODO]` | `[TODO]` | `[TODO]` |
