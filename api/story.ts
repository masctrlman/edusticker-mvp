import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, childName = "Bảo An", friendName = "Bo", mode = "magic", lang = "vi" } = req.body || {};
  const apiKey = process.env.META_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      story: "⚠️ [Lỗi]: Chưa có META_API_KEY trên Vercel.",
      stickers: [],
      lesson: "Kiểm tra lại Vercel Environment Variables."
    });
  }

  // Endpoint chuẩn xác tương thích OpenAI của Meta Model API (dev.meta.ai)
  const ENDPOINT = "https://api.llama.com/compat/v1/chat/completions";

  try {
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: [
          {
            role: "system",
            content: "Bạn là cô giáo mầm non ấm áp. Hãy viết câu chuyện cổ tích 3 đoạn văn ngắn gọn, thân thiện cho trẻ em dựa trên ảnh chụp sticker."
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Kể chuyện cổ tích cho bé ${childName} và bạn ${friendName}.` },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const rawText = await resp.text();

    if (!resp.ok) {
      return res.status(200).json({
        story: `🚨 [Meta API HTTP ${resp.status}]: ${rawText.slice(0, 200)}`,
        stickers: [],
        lesson: `Key đang dùng: ${apiKey.slice(0, 10)}... (Độ dài: ${apiKey.length})`
      });
    }

    const data = JSON.parse(rawText);
    const storyContent = data.choices?.[0]?.message?.content || "Không lấy được nội dung từ AI.";

    return res.status(200).json({
      story: storyContent,
      stickers: [],
      lesson: "✨ [META MODEL API LIVE] — Đã gọi thành công và đốt credit thật!"
    });
  } catch (err: any) {
    return res.status(200).json({
      story: `🚨 [Runtime Error]: ${err?.message || String(err)}`,
      stickers: [],
      lesson: "Lỗi hệ thống."
    });
  }
}