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
- Reflect important user-facing changes, setup changes, and workflow changes in the relevant README documentation.

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
- In `views/appView.ts`, initialize UI elements inside focused `create...` methods that return the element or a small typed view object. Keep `createAppView` focused on composing those methods, following patterns such as `createAudioWavePanel`, `createPlayedKeysPanel`, and `createKeyboardControls`; avoid initializing UI elements inline there.
- Create a new file under `todo-improve-architecture/` only when no existing file clearly owns the responsibility and the implementation is not a natural part of an existing module.
- Name the file with 1-3 lowercase kebab-case words that describe the feature.

## Visualization directories

- Keep each audio visualization implementation in its own 1-3 word kebab-case directory under `audio-visualization/`, for example `audio-visualization/audio-wave/` and `audio-visualization/played-keys/`.
- Keep shared visualization interfaces and helpers directly under `audio-visualization/`; do not combine separate visualization implementations into one directory or file.

## Keyboard input

- Keep the shared musical-keyboard-input interface and its callback/target types in `musical-keyboard-input/keyboard-input.ts`.
- Keep each input source implementation in its own directory under `musical-keyboard-input/`, such as `musical-keyboard-input/computer-keyboard/` and `musical-keyboard-input/mouse/`. Keep source-specific key mappings in that source's directory.
- Route input through the shared interface instead of adding source-specific event listeners to the keyboard renderer. Add future sources, such as MIDI, as separate implementations of that interface.

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
- After making and validating requested changes, inspect the app-root worktree and run `git add .` from the app root to stage them. Skip staging only if the user explicitly says not to stage.
- Once the task is complete and changes are staged, use a confirmation dialog to ask whether to commit. Ask at the end of the task; do not wait for the user to click Keep/Undo in the Copilot UI, because this workflow cannot detect those decisions.
- Never commit without explicit user confirmation. Do not ask for a separate acceptance confirmation before staging.
- Include an editable commit-message field in the confirmation dialog, prefilled with a clear suggested message so the user can replace it with their own.
- If the user confirms, run `git commit` using the message currently in that field. If the user declines or cancels, leave the changes staged and do not commit.

## Recording prompts

- Unless the user opts out, record task requests and materially new task follow-ups verbatim in `prompts/prompt-DD-MM-YY.txt`, using the date each message was sent. The filename must contain only the date: never put a time in the filename and never create a separate timestamp-named prompt file. Put each timestamp (`DD-MM-YY:HH-MM-SS`) in its log entry; colons are not valid in Windows filenames. Append UTF-8 text with a blank line separator, creating the daily file if needed. If a timestamp-named prompt file is accidentally created, move its prompt into the appropriate daily log and remove the incorrectly named file.
- Do not record conversational-only clarifications, discussion, or acknowledgements that do not themselves request or advance task work. If a later actionable prompt clearly refers to an earlier clarification (for example, “Ok, do it”), record that relevant clarification verbatim with its original timestamp along with the actionable follow-up. Do not include unrelated conversational messages.
- Before appending, check all `prompts/prompt-*.txt` logs, not just that day's log, for the same request. If a prompt was resent due to a retry or service issue without materially changing the request, record it only once across all dates and keep the earliest timestamp; do not treat the resend as a new prompt.
- If duplicate entries are already present across the logs, remove the later copies and retain the earliest entry.
- Record a materially new task follow-up as a separate prompt, even if it concerns the same topic.
- Never record credentials, private keys, tokens, or unrelated sensitive information. Sensitive information includes filepaths. If there is filepath write it only relative to the root.
- Record eligible task prompts before finishing the task and verify that the exact prompt text and timestamp appear in the intended daily log. For deferred clarifications, record them when a later actionable prompt refers to them. If recording fails, correct it and verify again; do not claim it was recorded otherwise.
- Do not block implementation with prompt recording unless the user explicitly requests it.
