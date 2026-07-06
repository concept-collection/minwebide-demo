# minwebide-demo

Live demo of [minwebide](https://github.com/magland/minwebide) — a
minimalistic web IDE built from VS Code's own source code, with the file
system persisted in your browser's IndexedDB.

**Live site:** https://concept-collection.github.io/minwebide-demo/

The landing page manages **projects**: each project is its own workspace in
your browser's IndexedDB (create / rename / duplicate / delete), and the open
project is addressed in the URL as `#/project/<id>`. Create a **sample
project** to see the showcase content, then try:

- Open files from the Explorer; edit and press **Ctrl+S**; reload — changes persist.
- `data/measurements.csv` opens as a table; `README.md` has a markdown preview
  (icons in the tab bar switch representations).
- Open `scripts/sine-wave.js` and press **▶**: console output goes to the
  bottom Output panel, plots render in the secondary side bar.
- Search across files from the activity bar.
- The project name in the status bar takes you back to the project list.

## Development

minwebide is consumed as a sibling checkout (`file:../minwebide`):

```sh
git clone https://github.com/magland/minwebide ../minwebide
(cd ../minwebide && npm install)   # fetches the pinned VS Code source
npm install
npm run dev
```

CI does the same: the deploy workflow checks out `magland/minwebide` next to
this repo, installs both, builds, and publishes `dist/` to GitHub Pages.
