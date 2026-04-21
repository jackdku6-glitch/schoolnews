# School Hub — Hackathon Starter Template

A unified Next.js starter for the AI Builders Hackathon. Four project ideas live inside one shared app. Pick one and build your prototype.

## Start here

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Supabase keys
Copy `.env.example` to `.env.local` and fill in your project URL and anon key:
```bash
cp .env.example .env.local
```
Get your keys from [supabase.com](https://supabase.com) → your project → Settings → API.

### 3. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Choose your project
Click one of the four project cards on the home page:
- **Lost & Found** — report lost/found items
- **News Board** — post school news and announcements
- **Club Manager** — join clubs and track attendance
- **Smart Canteen** — browse the menu and place orders

### 5. Customize your page
Open the matching file and start building:

| Project | File |
|---|---|
| Lost & Found | `app/lost-found/page.tsx` |
| News Board | `app/news-board/page.tsx` |
| Club Manager | `app/club-manager/page.tsx` |
| Smart Canteen | `app/smart-canteen/page.tsx` |

Each page already has a form, a list, and empty-state handling. Your job is to connect the form to Supabase and display real data.

## Connecting to Supabase
Each page has a commented-out `TODO` block showing exactly where to add the Supabase call. Example:
```ts
// TODO: save to Supabase
// await supabase.from('lost_found').insert(newItem)
```
Import `supabase` from `@/lib/supabase` and replace the comment with the real call.

## Shared components
| Component | Purpose |
|---|---|
| `Header` | App title bar |
| `NavBar` | Navigation between pages |
| `ProjectCard` | Card on the home page |
| `FormField` | Reusable labeled input (supports textarea) |
| `ItemCard` | Card to display a list entry |
| `EmptyState` | Shown when a list is empty |
| `SubmitButton` | Styled submit button |
