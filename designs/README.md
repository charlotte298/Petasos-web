# Design files

- **`petasos-landing.pen`**: the source design for the landing page. Open it in
  [Pencil](https://pen.dev). The page is the top-level frame `PdCYX` "Landing — Desktop",
  1440px wide.
- **`landing-desktop.png`**: a full-page render of that frame, so you can look at the design
  without installing anything.

The design has tokens (colors and fonts) that `src/index.css` mirrors. If you change a token or
a section in the .pen, update the matching file in `src/components/sections/` too. Section frame
IDs are listed in the main [README](../README.md).

Known differences between the .pen and the live site:

- The footer in the .pen still says "Amy". The site says "Petasos".
- Accent buttons on the site use `#C94A22`, and form placeholders use `#6B757D`. The .pen uses
  `#E2572C` and `#8A949C`. The site's darker colors meet WCAG AA contrast.
- The .pen only has a desktop frame. The site's mobile and tablet layouts are defined in code.
