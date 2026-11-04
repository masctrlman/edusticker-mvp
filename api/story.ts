import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, childName = "Leo", friendName = "Mia", mode = "magic", lang = "en" } = req.body || {};
  const apiKey = process.env.META_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      story: "🚨 [DEBUG ERROR]: Biến môi trường META_API_KEY trên Vercel đang trống hoàn toàn!",
      stickers: [],
      lesson: "Kiểm tra lại Vercel Settings -> Environment Variables."
    });
  }

  // Sử dụng cổng /compat/v1/ chuẩn tương thích OpenAI của Meta
  const ENDPOINT = "https://api.llama.com/compat/v1/chat/completions";

  try {
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Create a short fairy tale for ${childName} and ${friendName}.` },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const rawText = await resp.text();

    // NẾU LỖI: In thẳng mã lỗi HTTP và nội dung từ Meta ra màn hình ứng dụng để thấy rõ nguyên nhân!
    if (!resp.ok) {
      return res.status(200).json({
        story: `🚨 [META API HTTP ${resp.status} ERROR]:\n${rawText}`,
        stickers: [],
        lesson: `Key đang dùng: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
      });
    }

    const data = JSON.parse(rawText);
    const content = data.choices?.[0]?.message?.content || "Thành công nhưng nội dung trống.";

    return res.status(200).json({
      story: content,
      stickers: [],
      lesson: "✅ [META API SUCCESS] — Đã gọi thành công và đốt credit thật!"
    });
  } catch (err: any) {
    return res.status(200).json({
      story: `🚨 [RUNTIME EXCEPTION]: ${err?.message || String(err)}`,
      stickers: [],
      lesson: "Lỗi thực thi mã nguồn."
    });
  }
}