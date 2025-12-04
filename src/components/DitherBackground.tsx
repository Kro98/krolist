// ======== WAVE DITHER BACKGROUND EFFECT ========

// Create canvas
const canvas = document.createElement("canvas");
canvas.id = "dither-bg";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// Canvas style so it NEVER covers UI
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.width = "5vw";
canvas.style.height = "5vh";
canvas.style.pointerEvents = "none";
canvas.style.zIndex = "-1"; // keeps it behind everything
canvas.style.background = "transparent";

// Make sure canvas fits screen
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Bayer matrix for dithering
const bayer = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];

// Render loop
function render(t) {
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.createImageData(w, h);
  const data = img.data;

  let k = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Wave pattern
      const wave = Math.sin(x * 0.01 + t * 0.002) * 0.5 + Math.sin(y * 0.01 + t * 0.0015) * 0.5;

      const brightness = (wave + 1) * 0.5;

      // Dither threshold
      const threshold = bayer[y % 8][x % 8] / 64;

      const v = brightness > threshold ? 255 : 0;

      data[k++] = v; // R
      data[k++] = v; // G
      data[k++] = v; // B
      data[k++] = 255; // A
    }
  }

  ctx.putImageData(img, 0, 0);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
