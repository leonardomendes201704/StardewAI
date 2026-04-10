const desktopQuery = window.matchMedia("(min-width: 1081px)");

function syncHeroShowcaseSize() {
  const heroVisual = document.querySelector(".hero-visual");
  const heroTitle = document.querySelector(".hero-copy h1");

  if (!heroVisual || !heroTitle) {
    return;
  }

  if (!desktopQuery.matches) {
    heroVisual.style.removeProperty("--showcase-height");
    heroVisual.style.removeProperty("--showcase-width");
    return;
  }

  const titleHeight = Math.ceil(heroTitle.getBoundingClientRect().height);
  const showcaseWidth = Math.ceil(titleHeight * 0.82);

  heroVisual.style.setProperty("--showcase-height", `${titleHeight}px`);
  heroVisual.style.setProperty("--showcase-width", `${showcaseWidth}px`);
}

window.addEventListener("resize", syncHeroShowcaseSize);
window.addEventListener("load", syncHeroShowcaseSize);
desktopQuery.addEventListener("change", syncHeroShowcaseSize);

if (document.fonts?.ready) {
  document.fonts.ready.then(syncHeroShowcaseSize);
}
