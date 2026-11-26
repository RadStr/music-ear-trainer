# Agent Instructions

## Project

- This is a small browser application for learning music by ear.
- The source is TypeScript and is bundled into `dist/index.html`.
- Keep changes small, clear, and focused on the request.

## Working Rules

- Follow the existing TypeScript and project conventions.
- Keep strict type safety; do not use `any` or unnecessary type casts.
- Prefer existing helpers and patterns before adding new abstractions.
- Keep UI behavior accessible and responsive.
- Do not change unrelated files or generated `dist` output unless the task requires it.
- Preserve existing behavior unless a behavior change is explicitly requested.

## UI and Interaction

- Add a visible hover highlight to every button.
- Use an existing or consistent focus and hover style rather than introducing isolated styles.
- Keep game-specific controls, status text, keyboard UI, and hints hidden until a game is started or selected.
- On the initial game-selection screen, do not show controls or information belonging to a previously active or completed game.

## Game Lifecycle

- Leaving a game page or changing away from the active game must end the game.
- Reset all previous-game state when leaving or restarting a game, including guesses, submitted state, failed guesses, hints, playback state, timers, and game-specific UI text.
- Do not leave stale strings or counters from the previous game visible after navigation or reset.
- A newly started game must begin with a clean state and only show controls appropriate to that game.

## Common Commands

- `npm run check` - run the TypeScript type checker.
- `npm run build` - build the browser bundle.

Run the smallest relevant check before finishing. Run both commands when a change affects application behavior or build output.

## Architecture

- Place each method or class in the existing file that owns the same responsibility.
- Create a new file under `todo-improve-architecture/` only when no existing file clearly owns the responsibility and the implementation is not a natural part of an existing module.
- Name the file with 1-3 lowercase kebab-case words that describe the feature.

## Testing

- Create or update a test when changing a method that starts, stops, restarts, schedules, seeks, buffers, or exposes state for audio playback.
- Cover observable behavior, including success, failure, and repeated-restart cases where relevant.

## Comments

- Add a JSDoc comment (`/** */`) to public exported methods and to methods that call more than two project-defined methods, are entry points such as `main`, or contain more than 40 lines.
- Describe the purpose, parameters, and return value in one or two sentences. Do not document obvious code.

## Git

- Treat the directory containing this `AGENTS.md` and the app's `package.json` as the app and repository root, regardless of Git metadata in parent directories.
- Run Git commands from the app root. Before staging or committing, verify that `git rev-parse --show-toplevel` resolves to the app root.
- Check for a `.git` entry in the app root itself. If it is absent, run `git init` from the app root even when a parent directory is already a Git repository, then verify the repository root.
- Never initialize, stage, or commit from a parent directory. Do not configure a remote.
- After the user accepts changes, stage the project changes with `git add .`. Do not create a commit automatically; ask the user to commit and provide a suggested commit message.

## Recording prompts

- Unless the user opts out, append each prompt to `prompts/prompt-DD-MM-YY.txt`.
- Format the timestamp as `DD-MM-YY:HH-MM-SS`. Append UTF-8 text with a blank line separator.
- Before appending, check all `prompts/prompt-*.txt` logs, not just that day's log, for the same request. If a prompt was resent due to a retry or service issue without materially changing the request, record it only once across all dates and keep the earliest timestamp; do not treat the resend as a new prompt.
- If duplicate entries are already present across the logs, remove the later copies and retain the earliest entry.
- Record a materially new follow-up as a separate prompt, even if it concerns the same topic.
- Never record credentials, private keys, tokens, or unrelated sensitive information. Sensitive information includes filepaths. If there is filepath write it only relative to the root.
- Do not block implementation or Git staging with prompt recording unless the user explicitly requests it.
