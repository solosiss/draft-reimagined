# Draft Reimagined

> **Work in progress.** This is an early prototype: features change often, things may break, and some parts are unfinished.

A champion select (pick and ban) tool for League of Legends coaches and broadcasts, with a tournament-style final screen. By Tomás Salas.

- Full pro draft flow: prepick, ban phase 1, pick phase 1, ban phase 2, pick phase 2 and a 60 s finalization.
- Manual control for both sides (blue and red), 30 s per turn, with lane swaps and pick replacement.
- Final screen with team logos, lane matchups, bans and the series format (BO1, BO3, BO5).
- Runs on your computer as a desktop app. Your teams and logos stay local.

## Download

Get the installer for your system from the [latest release](https://github.com/solosiss/draft-reimagined/releases/latest):

- **Windows:** the `.exe` installer.
- **macOS:** the `.dmg`. The app is not code-signed yet, so macOS may say it is damaged or from an unidentified developer. Right-click the app and choose **Open**, or run `xattr -cr "/Applications/Draft Reimagined.app"` once.
- **Linux:** the `.AppImage` (`chmod +x` it, then run it).

Windows may also show a "protected your PC" notice because the app is not signed. Choose **More info**, then **Run anyway**.

Champion names and art are loaded from public community servers, so the first launch needs an internet connection.

## Run it from source

```bash
cd ui
npm install
npm run dev
```

Open the printed address. Start from the home screen, or skip it while testing:

| URL | What it does |
| --- | --- |
| `/` | Home screen (start draft, team setup, close) |
| `/?sim` | Starts the simulated draft right away |
| `/?sim=final` | Jumps to the final screen with a finished draft |

To open it as a desktop window instead of a browser tab: `npm run electron`. To build installers locally: `npm run dist` (output in `ui/release/`).

## Teams and logos

This repository ships **no team data or logos**. Open **Team setup** to enter your teams: names, logo images you upload, colors, players and match format. Images are resized and stored in your browser or app storage only. They are never uploaded anywhere.

## Status

Work in progress (WIP). The draft runs on a built-in simulation where you operate both sides by hand. Reading a live champion select from the League client is not implemented, and the series data (tournament, stage, game number and score) is still placeholder.

## License

The code is released under the [MIT License](LICENSE). It does not cover the Riot Games lane icons or any logos you upload.

## Disclaimer

Draft Reimagined is not endorsed by Riot Games and does not reflect the views of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. Champion art is loaded at runtime from public community CDNs and is not part of this repository. The five lane icons in `ui/src/lib/lanes/` are Riot Games assets (via Community Dragon) used as non-commercial fan content; they remain Riot's property.
