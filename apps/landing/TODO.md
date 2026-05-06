# Sofia Proto Landing — TODO

## Before merge to Sofia-landing-page
- [ ] Decide Docusaurus `baseUrl` for prod (currently `/docs-app/`, needs to match deploy structure)
- [ ] Set `VITE_DOCS_URL` env var for prod build
- [ ] CI workflow: build Vite + Docusaurus, merge outputs for GitHub Pages deploy

## Post-merge
- [ ] Audit Privy integration against extension repo (same APP_ID/CLIENT_ID confirmed)
- [ ] Add tripleId for founder Citations (Samuel, Maxime) to enable on-chain voting
- [ ] GSAP integration for scroll animations (replace CSS-only parallax)
- [ ] Image optimization (bg1-7.png are 400-800KB each, logo-black.png is 416KB)
- [ ] Add About page (currently links to sofia.intuition.box/about)
- [ ] Add Privacy/Terms pages (currently links to sofia.intuition.box)
