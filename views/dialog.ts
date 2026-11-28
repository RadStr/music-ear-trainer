/**
 * Closes a modal dialog when the user clicks its backdrop.
 * @param dialog The dialog whose backdrop should dismiss it.
 */
export function addBackdropClickListener(dialog: HTMLDialogElement): void {
  dialog.addEventListener("click", (event: MouseEvent): void => {
    if (event.target !== dialog) {
      return;
    }

    const bounds: DOMRect = dialog.getBoundingClientRect();
    const clickedOutside: boolean =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (clickedOutside) {
      dialog.close();
    }
  });
}
