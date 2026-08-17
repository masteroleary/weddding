# vendor

Third-party code, committed rather than pulled from a CDN so the site keeps
working if the CDN is unreachable.

## page-flip.browser.js

StPageFlip 2.0.7 — the page-turn animation used by `our-story-flipbook.html`.

- Source: https://github.com/Nodlik/StPageFlip
- Fetched from: https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js
- License: MIT
- Dependencies: none. Exposes a global `St`, so a plain `<script>` tag is all it needs.

Last published April 2021 and effectively unmaintained, but self-contained —
nothing about it rots. Unmodified from the published build; if it ever needs
changing, override from the page's own CSS/JS rather than editing this file.
