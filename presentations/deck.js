/* Shared setup for web decks. Keys: arrows move, F full screen, O overview,
   P presenter view with speaker notes (S works too). */
(function () {
  "use strict";
  Reveal.initialize({
    hash: true,
    slideNumber: "c/t",
    controls: true,
    progress: true,
    center: true,
    transition: "fade",
    backgroundTransition: "fade",
    width: 1600,
    height: 900,
    margin: 0.04,
    plugins: [RevealNotes],
    keyboard: {
      80: () => RevealNotes.open(), // P: presenter view
    },
  });

  // Show the back link while the mouse moves; hide it during the talk
  let t = 0;
  const show = () => {
    document.body.classList.add("show-ui");
    clearTimeout(t);
    t = setTimeout(() => document.body.classList.remove("show-ui"), 2200);
  };
  window.addEventListener("mousemove", show, { passive: true });
  show();
})();
