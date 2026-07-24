# StudyNest

StudyNest is a single-page study dashboard with a Pomodoro timer, tasks, deadlines, habit tracking, a calendar, ambient sounds, and customizable backgrounds.

## Run

Open `index.html` in a modern browser.

For the custom background manifest to load consistently in every browser, serve the folder with a tiny local server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project Structure

- `index.html` - App markup and modal/view containers.
- `css/themes.css` - Theme variables and color tokens.
- `css/styles.css` - Core layout, cards, modals, and view styling.
- `css/animations.css` - Motion preferences and animation-related rules.
- `css/responsive.css` - Tablet and mobile layout rules.
- `js/app.js` - App bootstrap and global handler wiring.
- `js/state.js` / `js/storage.js` / `js/utils.js` - Shared state, persistence, and helpers.
- `js/features/` - Timer, tasks, deadlines, habits, calendar, music, background, theme, and statistics modules.
- `js/ui/` - Notifications, modal helpers, and view navigation.
- `assets/backgrounds/` - Background images plus `manifest.json`.
- `assets/sounds/` - Ambient MP3 files used by the Music view.

## Notes

- User data is saved in `localStorage` under `studynest_v1`.
- Background images are read from `assets/backgrounds/manifest.json`.
- Ambient sounds are local files in `assets/sounds/`; browser autoplay rules may require a user click before playback starts.
