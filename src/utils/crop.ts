export async function cropStickersFromMasks(imageSrc: string, boxes: number[][]): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const crops = (boxes || []).map((b) => {
        const [xmin = 0, ymin = 0, xmax = 1000, ymax = 1000] = b;
        const x = Math.max(0, (xmin / 1000) * img.width);
        const y = Math.max(0, (ymin / 1000) * img.height);
        const w = Math.max(24, ((xmax - xmin) / 1000) * img.width);
        const h = Math.max(24, ((ymax - ymin) / 1000) * img.height);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        return canvas.toDataURL("image/png");
      });
      resolve(crops);
    };
    img.onerror = () => resolve([]);
    img.src = imageSrc;
  });
}