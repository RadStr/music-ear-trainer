import type { Effect } from "./Effect";

const FLOAT_DURATION_MILLISECONDS: number = 650;
const EXPLOSION_DURATION_MILLISECONDS: number = 1250;

export class ExplodingTextEffect implements Effect<string> {
  /** Floats the supplied text briefly before scattering and fading its characters. */
  trigger(text?: string): void {
    if (text === undefined || text.length === 0) {
      throw new TypeError("Exploding text effect requires non-empty text.");
    }

    const characters: string[] = Array.from(text);
    const container: HTMLDivElement = document.createElement("div");
    container.className = "exploding-text-effect";
    container.setAttribute("aria-hidden", "true");
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.display = "flex";
    container.style.transform = "translate(-50%, -50%)";
    container.style.whiteSpace = "pre";
    container.style.fontSize = "clamp(2rem, 8vw, 5rem)";
    container.style.fontWeight = "700";
    container.style.color = "#f9c74f";
    container.style.textShadow = "0 2px 12px rgba(0, 0, 0, 0.35)";
    container.style.pointerEvents = "none";
    container.style.zIndex = "1101";
    document.body.append(container);

    let remainingCharacters: number = characters.length;
    for (const character of characters) {
      const letter: HTMLSpanElement = document.createElement("span");
      letter.textContent = character;
      letter.style.display = "inline-block";
      container.append(letter);

      const horizontalDistance: number = (Math.random() - 0.5) * window.innerWidth;
      const verticalDistance: number = (Math.random() - 0.5) * window.innerHeight;
      const rotation: number = Math.random() * 720 - 360;
      const animation: Animation = letter.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1, offset: 0 },
          {
            transform: "translate(0, -18px) rotate(0deg)",
            opacity: 1,
            offset: FLOAT_DURATION_MILLISECONDS /
              (FLOAT_DURATION_MILLISECONDS + EXPLOSION_DURATION_MILLISECONDS),
          },
          {
            transform: `translate(${horizontalDistance}px, ${verticalDistance}px) rotate(${rotation}deg)`,
            opacity: 0,
            offset: 1,
          },
        ],
        {
          duration: FLOAT_DURATION_MILLISECONDS + EXPLOSION_DURATION_MILLISECONDS,
          easing: "ease-out",
          fill: "forwards",
        },
      );
      animation.onfinish = (): void => {
        remainingCharacters -= 1;
        if (remainingCharacters === 0) {
          container.remove();
        }
      };
    }
  }
}
