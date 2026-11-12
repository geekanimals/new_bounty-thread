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

## Creator panel (/creater) — violet design
Sab `src/app/creater/` ke andar, har page ka code + CSS uski `page.jsx` mein.

| Route | Page |
|---|---|
| `/creater` | Login (WhatsApp → OTP → Instagram) |
| `/creater/explore`, `/creater/explore/[id]` | Live campaigns (bina login) |
| `/creater/dashboard` | Dashboard (+ notifications panel) |
| `/creater/complete-profile`, `/creater/agent` | Profile complete, Creator Agent |
| `/creater/media-kit`, `/creater/profile` | Media Kit, Creator Profile |
| `/creater/instagram` (+ `/stories`, `/comments`, `/dms`, `/insights`) | Instagram |
| `/creater/messages` | Messages |
| `/creater/campaigns`, `/creater/campaigns/[id]` | Campaigns, detail / not eligible |
| `/creater/my-campaigns` (+ `/contract`, `/address`, `/video`, `/post`, `/payment`, `/questions`) | My Campaigns + har step |
| `/creater/reports` | Reports (CSV download) |

- `app/creater/layout.jsx` — font (Plus Jakarta Sans) + creator colours + chhote common classes
- `components/creater/CreaterShell.jsx` — sidebar + top bar (sab logged-in pages)
- `components/creater/InstagramTabs.jsx` — Instagram ke tabs
- `components/creater/data.jsx` — DUMMY data (backend aane par yahan API)
