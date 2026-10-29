// Owns the class string for a sideways-scrolling row of chips: room for the
// keyboard focus ring, and a fade on the right edge so a student can see the
// row goes on past the screen.
//
// A scrolling row clips whatever pokes out of it, and the focus ring sits 4px
// outside a chip (2px offset + 2px width, app/globals.css). So the row pads
// 4px on top, bottom and left, and pulls itself 4px left to stay in line.
// The fade is a mask, not a colour: it changes only how opaque the row's own
// pixels are, so it works in every theme without a token. The row keeps 1.5rem
// of padding at its end, which is where the fade falls: when the chips fit,
// only empty padding fades, and at the end of a scroll the last chip has
// already passed the fade. It deliberately does NOT add a scrollbar or arrows.

export const FADE_ROW =
  "-ml-1 py-1 pl-1 pr-6 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]";
