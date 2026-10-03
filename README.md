# Syrka landing page

The syrka.co homepage: a single Next.js page (`app/page.tsx`) built from the components in `components/landing/`.
Campus and sign-in links point to https://syrka.co.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

Background videos live in `public/media/` (960×540 H.264, 10 s, no audio). Bump the `?v=` query on a video's URL in
`app/page.tsx` after re-encoding it in place, or browsers that cached the old file will stall.
