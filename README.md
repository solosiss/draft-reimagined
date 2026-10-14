# Draft Reimagined

> **Work in progress.** This is an early prototype: features change often, things may break, and some parts are unfinished.

A champion select (pick and ban) tool for League of Legends coaches and broadcasts, with a tournament-style final screen. By Tomás Salas.

- Full pro draft flow: prepick, ban phase 1, pick phase 1, ban phase 2, pick phase 2 and a 60 s finalization.
- Manual control for both sides (blue and red), 30 s per turn, with lane swaps and pick replacement.
- Final screen with team logos, lane matchups, bans and the series format (BO1, BO3, BO5).
- Runs on your computer as a desktop app. Your teams and logos stay local.

## Two products

| | **Draft Reimagined** (coach) | **Draft Reimagined Broadcast** |
| --- | --- | --- |
| For | Coaches running scrim and tournament drafts | Broadcasts and productions |
| Draft source | You operate both sides by hand (simulated draft) | Reads the champion select of the League client in real time |
| Controls | Grid, lock, swaps, pick replacement | None: it only displays |
| Reads the client | No, the code is not even included | Yes, read-only |

### Reading the League client (Broadcast)

- Connects to the local League client API (`127.0.0.1`) and polls the champion select session. It **only reads**: it never hovers, locks, bans or changes anything.
- It shows what the client already shows, nothing hidden. It does not touch the game process or its memory.
- Riot does not officially support or guarantee this local API, and it can change in any patch. Use it at your own risk and check Riot's [third-party application policy](https://support-leagueoflegends.riotgames.com/hc/en-us/articles/225266848).
- The League client must run on the same computer. Open the app, choose **Connect to League client**, then start the custom game or draft. Launch with `--live` to connect automatically.
- If the client is installed outside the default folder, it is found from the running process. You can also set `LEAGUE_LOCKFILE` to the path of its `lockfile`.
- **Not tested against a live client yet.** It is covered by unit tests and a local mock of the client. Whether a spectator sees the champion select of a custom game still has to be checked in a real game.

## Download

Get the installers from the [latest release](https://github.com/solosiss/draft-reimagined/releases/latest):

- **Windows:** the `.exe` installer.
- **macOS:** the `.dmg` (Apple silicon). The app is not code-signed yet, so macOS may say it is damaged or from an unidentified developer. Right-click the app and choose **Open**, or run `xattr -cr "/Applications/Draft Reimagined.app"` once.
- **Linux:** the `.AppImage` (`chmod +x` it, then run it).

Each system has one installer for the coach product and one for Broadcast. Windows may show a "protected your PC" notice because the app is not signed: choose **More info**, then **Run anyway**.

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

Broadcast version: `npm run dev:broadcast` (browser, no client reading) or `npm run electron:broadcast` (desktop, reads the client). Coach desktop window: `npm run electron`. Installers: `npm run dist:coach` or `npm run dist:broadcast` (output in `ui/release/`). Tests: `npm test`.

## Teams and logos

This repository ships **no team data or logos**. Open **Team setup** to enter your teams: names, logo images you upload, colors, players and match format. Images are resized and stored in your browser or app storage only. They are never uploaded anywhere.

## Status

Work in progress (WIP). The coach version runs on a built-in simulation. The Broadcast version reads the League client but has not been tested against a live client yet. The series data (tournament, stage, game number and score) is still placeholder.

## License

The code is released under the [MIT License](LICENSE). It does not cover the Riot Games lane icons or any logos you upload.

## Disclaimer

Draft Reimagined is not endorsed by Riot Games and does not reflect the views of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. Champion art is loaded at runtime from public community CDNs and is not part of this repository. The five lane icons in `ui/src/lib/lanes/` are Riot Games assets (via Community Dragon) used as non-commercial fan content; they remain Riot's property.
