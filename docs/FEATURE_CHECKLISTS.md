## Feature Checklists (Required)

Each checklist contains acceptance criteria, including error conditions. Use these during demos.

### 1) Authentication (Supabase)
1. User can sign up and sign in with email/password; invalid creds show clear errors.
2. Session persists across pages (about/services/contact/dashboard) without logging out.
3. Protected pages redirect unauthenticated users to `login.html` with a notice.
4. Logout clears Supabase session and local storage; UI updates immediately.
5. Error states: network failure, invalid anon key, missing env config show toasts (no silent failure).
6. Accessibility: focus order, labels, keyboard submit, and visible error text.
7. Mobile/tablet layouts remain usable and visually consistent.

### 2) Practice Sessions (Problems + Code Execution)
1. User starts a session with topic/difficulty; timer and question load reliably.
2. Submit runs code via configured executor; outputs and per-test pass/fail render.
3. Hints display correctly (multiple hints supported); solution toggle works.
4. Next/End Session updates attempts, correctness, and time spent.
5. On end, session is saved (with `endTime`, `status`, `results`, `totalTime`); progress updated.
6. Error states: execution timeout/error, API/network failure, invalid question data → user sees feedback and can retry.
7. State is resilient to refresh; no orphaned UI or broken controls.

### 3) Dashboard Analytics (Stats + Charts + Activity)
1. "Your Stats" updates totals (solved, time, accuracy, streak) after a session.
2. "Progress Over Time" chart reflects last 7 days with current day refresh.
3. "Topic Performance" always renders all topics; values update from progress table.
4. "Recent Activity" renders up to five recent sessions or a styled empty state.
5. Progressive loaders hide when sections load or when empty state is shown.
6. Error states: when backend unavailable, dashboards show zeros/empty states without mock data.
7. Visibility/focus return from practice triggers reload (with retry) and updates sections.


