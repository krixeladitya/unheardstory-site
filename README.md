# Unheard Story — unheardstory.in

Netflix-style catalog site for the [Unheard Story](https://www.youtube.com/@UnheardYTStory) YouTube channel.
3D-animated shorts about family, justice, and secrets.

Static site — no build step. `data.js` is the entire catalog:

- `CATALOG` — released videos (real YouTube IDs; thumbnails hotlinked from i.ytimg.com)
- `COMING_SOON` — unreleased titles shown as teaser posters
- `ROWS` — shelf definitions

To update after a new upload, add an entry to `CATALOG` and push to `main` —
GitHub Pages redeploys automatically.

© Krixel Studio
