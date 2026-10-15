// Shared proportions keep the sampled particle frame aligned with the live card.
export const PRODUCT_FRAME = { width: 1280, height: 980, bar: 96, image: 760, footer: 124, radius: 30 };
export const PRODUCT_ASPECT = PRODUCT_FRAME.width / PRODUCT_FRAME.height;

// Sample the thin frame explicitly; a coarse image grid can miss a 1px border.
export function traceProductFrame(add, step) {
  const { width, height, radius, bar, image } = PRODUCT_FRAME;
  const line = (x1, y1, x2, y2, color) => {
    const count = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step);
    for (let i = 0; i <= count; i++) add(x1 + (x2 - x1) * i / count, y1 + (y2 - y1) * i / count, color);
  };
  const edge = '#aeb4a8';
  line(radius, 1, width - radius, 1, edge);
  line(radius, height - 1, width - radius, height - 1, edge);
  line(1, radius, 1, height - radius, edge);
  line(width - 1, radius, width - 1, height - radius, edge);
  for (const [cx, cy, start] of [[radius, radius, Math.PI], [width - radius, radius, -Math.PI / 2], [width - radius, height - radius, 0], [radius, height - radius, Math.PI / 2]]) {
    const count = Math.ceil(Math.PI * radius / 2 / step);
    for (let i = 0; i <= count; i++) {
      const angle = start + i / count * Math.PI / 2;
      add(cx + (radius - 1) * Math.cos(angle), cy + (radius - 1) * Math.sin(angle), edge);
    }
  }
  line(1, bar, width - 1, bar, '#c6c9c0');
  line(1, bar + image, width - 1, bar + image, '#c6c9c0');
}

export function framedProduct(image) {
  const { width, height, bar, image: imageHeight, radius } = PRODUCT_FRAME;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f6f5f2';
  ctx.fillRect(0, 0, width, bar);
  ctx.drawImage(image, 0, bar, width, imageHeight);
  ctx.strokeStyle = '#dedfda';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, bar); ctx.lineTo(width, bar);
  ctx.moveTo(0, bar + imageHeight); ctx.lineTo(width, bar + imageHeight);
  ctx.stroke();
  ctx.fillStyle = '#c6c9c0';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(38 + i * 25, bar / 2, 6.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#666b64';
  ctx.font = '23px "Geist Mono", monospace';
  ctx.fillText('linguaclassroom.com', 132, bar / 2);
  ctx.fillStyle = '#20211f';
  ctx.font = '31px "Geist", sans-serif';
  ctx.fillText('Lingua', 38, bar + imageHeight + 62);
  ctx.fillStyle = '#65765e';
  ctx.font = '28px "Geist", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Visit site ↗', width - 38, bar + imageHeight + 62);
  ctx.strokeStyle = '#c6c9c0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(1.25, 1.25, width - 2.5, height - 2.5, radius);
  ctx.stroke();
  return canvas;
}
