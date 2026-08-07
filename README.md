# keystride

A typing trainer — practice tests (time/word modes), a falling-words arcade
game, technique lessons with a live finger-guide keyboard, and persistent
XP/level + stats across both modes. Everything is saved to `localStorage`;
there's no backend.

## Develop

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm install
bash scripts/bundle-artifact.sh   # or see below — produces bundle.html
```

The app builds to a single self-contained `bundle.html` with all JS/CSS
inlined — no server, no build step needed to run it, just open the file.

## Deploy

`docs/index.html` is a pre-built copy of that bundle, kept in the repo so
GitHub Pages can serve it directly with zero CI:

1. Push this repo to GitHub.
2. Repo Settings → Pages → Source: **Deploy from a branch** → Branch: `main`,
   folder: `/docs`. Save.
3. GitHub gives you a `https://<user>.github.io/<repo>/` URL in a minute or two.

After any change, rebuild and refresh the deployed copy:

```bash
bash scripts/bundle-artifact.sh
cp bundle.html docs/index.html
git add docs/index.html && git commit -m "update build" && git push
```

Netlify Drop works too — see the project chat for the drag-and-drop steps,
or connect this repo in the Netlify dashboard and point the publish
directory at `docs`.
