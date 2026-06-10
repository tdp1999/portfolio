export const OPEN_DELAY_MS = 80;
export const CLOSE_DELAY_MS = 200;
/** After a hover-open, clicks within this window are treated as "keep open"
 *  (defeats the hover→click-toggle-off race). Past this window, click toggles
 *  off normally — otherwise users feel like they need to click twice to close. */
export const HOVER_GRACE_MS = 250;
