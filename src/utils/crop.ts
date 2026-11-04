function autoDetectBoxesFromCanvas(img: HTMLImageElement): number[][] {
  const scanW = 100;
  const scanH = 100;
  const c = document.createElement("canvas");
  c.width = scanW;
  c.height = scanH;
  const ctx = c.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, scanW, scanH);
  const data = ctx.getImageData(0, 0, scanW, scanH).data;

  // Lấy màu nền trung bình ở 4 góc ảnh
  const corners = [
    [2, 2],
    [scanW - 3, 2],
    [2, scanH - 3],
    [scanW - 3, scanH - 3]
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [cx, cy] of corners) {
    const idx = (cy * scanW + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= 4;
  bgG /= 4;
  bgB /= 4;

  const visited = new Uint8Array(scanW * scanH);
  const mask = new Uint8Array(scanW * scanH);

  for (let y = 4; y < scanH - 4; y++) {
    for (let x = 4; x < scanW - 4; x++) {
      const i = (y * scanW + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturation = maxC - minC;
      const diffBg = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      // Điểm ảnh thuộc về sticker nếu có màu sắc tươi (saturation > 35) hoặc khác biệt rõ với nền (> 65)
      if (saturation > 38 || diffBg > 70) {
        mask[y * scanW + x] = 1;
      }
    }
  }

  const foundBoxes: { xmin: number; ymin: number; xmax: number; ymax: number; area: number }[] = [];

  for (let y = 4; y < scanH - 4; y++) {
    for (let x = 4; x < scanW - 4; x++) {
      const idx = y * scanW + x;
      if (mask[idx] && !visited[idx]) {
        let minX = x, maxX = x, minY = y, maxY = y, count = 0;
        const queue = [idx];
        visited[idx] = 1;

        while (queue.length > 0) {
          const curr = queue.pop()!;
          const cy = Math.floor(curr / scanW);
          const cx = curr % scanW;
          count++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 2 && nx < scanW - 2 && ny >= 2 && ny < scanH - 2) {
                const nIdx = ny * scanW + nx;
                if (mask[nIdx] && !visited[nIdx]) {
                  visited[nIdx] = 1;
                  queue.push(nIdx);
                }
              }
            }
          }
        }

        const bw = maxX - minX;
        const bh = maxY - minY;
        if (count >= 12 && bw >= 5 && bh >= 5 && bw <= 45 && bh <= 45) {
          foundBoxes.push({
            xmin: Math.max(0, (minX - 2) * 10),
            ymin: Math.max(0, (minY - 2) * 10),
            xmax: Math.min(1000, (maxX + 2) * 10),
            ymax: Math.min(1000, (maxY + 2) * 10),
            area: count
          });
        }
      }
    }
  }

  return foundBoxes
    .sort((a, b) => b.area - a.area)
    .slice(0, 8)
    .map((b) => [b.xmin, b.ymin, b.xmax, b.ymax]);
}

export async function cropStickersFromMasks(imageSrc: string, boxes: number[][]): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const validBoxes = (boxes || []).filter(
        (b) => Array.isArray(b) && b.length === 4 && !(b[0] === 0 && b[1] === 0 && b[2] === 1000 && b[3] === 1000)
      );

      const finalBoxes = validBoxes.length > 0 ? validBoxes : autoDetectBoxesFromCanvas(img);

      const results: string[] = [];
      for (const b of finalBoxes) {
        const [xmin, ymin, xmax, ymax] = b;
        const x = Math.max(0, (xmin / 1000) * img.width);
        const y = Math.max(0, (ymin / 1000) * img.height);
        const w = Math.max(24, ((xmax - xmin) / 1000) * img.width);
        const h = Math.max(24, ((ymax - ymin) / 1000) * img.height);

        const c = document.createElement("canvas");
        const pad = 12;
        c.width = w + pad * 2;
        c.height = h + pad * 2;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(0, 0, c.width, c.height, 16);
          ctx.fill();
          ctx.drawImage(img, x, y, w, h, pad, pad, w, h);
          results.push(c.toDataURL("image/png"));
        }
      }
      resolve(results);
    };
    img.onerror = () => resolve([]);
    img.src = imageSrc;
  });
}