import type { Effect } from "./Effect";

const CONFETTI_COLORS: readonly string[] = [
  "#f94144",
  "#f3722c",
  "#f9c74f",
  "#43aa8b",
  "#577590",
  "#9b5de5",
];
const CONFETTI_COUNT: number = 80;

export class ConfettiEffect implements Effect<void> {
  /** Shows a burst of animated confetti, then removes its temporary elements. */
  trigger(_data?: void): void {
    const container: HTMLDivElement = document.createElement("div");
    container.className = "confetti-effect";
    container.setAttribute("aria-hidden", "true");
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.zIndex = "1100";
    document.body.append(container);

    let remainingPieces: number = CONFETTI_COUNT;
    for (let index: number = 0; index < CONFETTI_COUNT; index += 1) {
      const piece: HTMLSpanElement = document.createElement("span");
      piece.style.position = "absolute";
      piece.style.top = "12%";
      piece.style.left = "50%";
      piece.style.width = `${6 + Math.random() * 6}px`;
      piece.style.height = `${10 + Math.random() * 10}px`;
      piece.style.backgroundColor =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? "#f94144";
      container.append(piece);

      const horizontalDistance: number = (Math.random() - 0.5) * window.innerWidth;
      const verticalDistance: number = window.innerHeight * (0.65 + Math.random() * 0.35);
      const rotation: number = Math.random() * 900 - 450;
      const animation: Animation = piece.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${horizontalDistance}px, ${verticalDistance}px) rotate(${rotation}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1600 + Math.random() * 1000,
          delay: Math.random() * 180,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        },
      );
      animation.onfinish = (): void => {
        piece.remove();
        remainingPieces -= 1;
        if (remainingPieces === 0) {
          container.remove();
        }
      };
    }
  }
}
