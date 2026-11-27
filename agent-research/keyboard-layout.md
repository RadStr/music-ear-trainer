> **Research provenance:** This document is the result of research by a Copilot agent in response to this prompt:
>
> “Peform research on how usual tools map the key playing to standard keyboard. For example I know that surge xt uses the A keyboard row to play white keys and the Q row to play black keys and uses buttons X,C to go octave down, respectively up. Perform research on how other tools do it. Once done report the research to me, I wil lthen choose the "optimal" layout for this application.”

# Computer Keyboard Piano Layouts

This note compares how several music tools map computer-keyboard keys to musical notes. It records the selected layout for this application; it does not implement keyboard input.

## Comparison

| Tool | Note-key layout | Octave and other controls |
| --- | --- | --- |
| **Ableton Live** | The middle letter row plays white keys, with **A = C3**. The piano's black keys use selected keys on the row above: **W, E, T, Y, U, O**. | **Z** lowers and **X** raises the octave. **C/V** adjust velocity. **M** toggles the computer MIDI keyboard in Live 10 and later. |
| **GarageBand** | Musical Typing uses a similar piano-shaped layout: the middle row plays white keys and selected keys on the row above play black keys. | **Z/X** shift the octave; **C/V** adjust velocity. |
| **FL Studio** | Its standard layout maps a piano across paired rows. Lower octave: white keys **Z, X, C, V, B, N, M** and black keys **S, D, G, H, J**. Upper octave: white keys **Q, W, E, R, T, Y, U** and black keys **2, 3, 5, 6, 7**. | Change the octave through the typing-keyboard toolbar menu. The cited guide also documents **Alt + numpad 2–6** on Windows. |
| **VirtualPiano.net** | A browser-piano layout labels computer keys on the on-screen piano; its guide describes using **Shift** with keys to play black notes. | **Key Assist** displays the key labels and associated octaves. |
| **Surge XT** | The user-reported layout uses the A row for white keys and the row above for black keys. The official manual documents its on-screen virtual keyboard, but does not confirm that exact computer-key mapping. | The user-reported octave controls are **X/C**. |

There is no single standard. The Ableton/GarageBand family resembles the piano visually, while FL Studio maps a wider range across more of the typing keyboard. Browser piano layouts vary and often emphasize visible labels and range.

## Selected Layout for This Application

Use the Ableton-style note arrangement: the middle letter row plays white keys, beginning with **A = C3**, and the corresponding black keys use **W, E, T, Y, U, O** on the row above.

The octave and possible velocity controls are intentionally different from Ableton:

- **X**: lower octave
- **C**: raise octave
- **V/B**: velocity adjustment keys, only if velocity adjustment is added later. Which key lowers or raises velocity has not been specified.

## Sources

- [Ableton Live 12 Reference Manual: MIDI and Key Remote Control](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/) — official documentation on key mapping and MIDI control. For the computer MIDI keyboard's note layout and octave/velocity keys, see [Sonic Bloom's Ableton tutorial](https://sonicbloom.net/ableton-live-tutorial-computer-keyboard-as-midi-controller/).
- [AppleInsider: How to play music using your Mac's keyboard with GarageBand's Musical Typing](https://appleinsider.com/articles/18/08/09/how-to-play-music-using-your-macs-keyboard-with-garagebands-musical-typing).
- [FL Studio computer-keyboard piano guide](https://flstudiopro.com/fl-studio-computer-keyboard-piano/) — a third-party guide with the standard key map and octave controls; it links to Image-Line's [keyboard shortcuts reference](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/basics_shortcuts.htm).
- [VirtualPiano.net: How to Play](https://virtualpiano.net/how-to-play/).
- [Surge XT User Manual](https://surge-synthesizer.github.io/manual-xt/) — documents opening Surge XT's on-screen virtual keyboard.
