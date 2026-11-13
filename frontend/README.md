# Geek Influencer OS — Website (frontend)

Next.js website — Option C (olive & cream) design.

## Chalana
```
npm install
npm run dev
```
Phir http://localhost:3000 kholo.

## Pages (src/app)
| Route | File |
|---|---|
| `/` | `app/page.jsx` |
| `/about` | `app/about/page.jsx` |
| `/contact` | `app/contact/page.jsx` |
| `/terms` | `app/terms/page.jsx` |
| `/privacy` | `app/privacy/page.jsx` |
| `/refund-cancellation` | `app/refund-cancellation/page.jsx` |
| `/shipping-delivery` | `app/shipping-delivery/page.jsx` |
| `/data-deletion` | `app/data-deletion/page.jsx` |
| `/unsubscribe` | `app/unsubscribe/page.jsx` |
| `/unsubscribe/done` | `app/unsubscribe/done/page.jsx` |
| 404 | `app/not-found.jsx` |

`app/layout.jsx` → fonts + header/footer/cookie banner (`components/layout/SiteChrome.jsx`).

## Components (src/components)
- `layout/` — Header, Footer, CookieBanner, SiteChrome (sab pages par common)
- `home/` — home page ke sections (Hero, Pricing ...) — `app/page.jsx` se manage
- `ui/` — Logo, Icons

Baaki har page (about, contact, terms, privacy, refund, shipping, data-deletion,
unsubscribe, 404) ka saara code + CSS sirf uski apni `page.jsx` mein hai.

## Styling
Har component ka CSS usi `.jsx` file ke andar `<style>` mein hai.
`app/globals.css` mein sirf basic reset hai.
Container: max-width 1400px, side padding 32px (mobile ≤640px: 20px).

## Creator panel (/creator) — violet design
Sab `src/app/creator/` ke andar, har page ka code + CSS uski `page.jsx` mein.

| Route | Page |
|---|---|
| `/creator` | Login (WhatsApp → OTP → Instagram) |
| `/creator/explore`, `/creator/explore/[id]` | Live campaigns (bina login) |
| `/creator/dashboard` | Dashboard (+ notifications panel) |
| `/creator/complete-profile`, `/creator/agent` | Profile complete, Creator Agent |
| `/creator/media-kit`, `/creator/profile` | Media Kit, Creator Profile |
| `/creator/instagram` (+ `/stories`, `/comments`, `/dms`, `/insights`) | Instagram |
| `/creator/messages` | Messages |
| `/creator/campaigns`, `/creator/campaigns/[id]` | Campaigns, detail / not eligible |
| `/creator/my-campaigns` (+ `/contract`, `/address`, `/video`, `/post`, `/payment`, `/questions`) | My Campaigns + har step |
| `/creator/reports` | Reports (CSV download) |

- `app/creator/layout.jsx` — font (Plus Jakarta Sans) + creator colours + chhote common classes
- `components/creator/creatorShell.jsx` — sidebar + top bar (sab logged-in pages)
- `components/creator/InstagramTabs.jsx` — Instagram ke tabs
- `components/creator/data.jsx` — DUMMY data (backend aane par yahan API)
