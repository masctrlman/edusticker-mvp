import type { VercelRequest, VercelResponse } from "@vercel/node";

function sanitizeName(name: string): string {
  return String(name || "")
    .replace(/\b(ignore|system|prompt|rule|instruction|admin|hack|kill|blood|sex|nsfw)\b/gi, "")
    .replace(/[^a-zA-Z0-9À-ỹ\s]/g, "")
    .trim()
    .slice(0, 15);
}

function extractJSONObject(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  return JSON.parse(cleaned);
}

function normalizeStickers(rawStickers: any[], lang: "en" | "vi"): any[] {
  if (!Array.isArray(rawStickers)) return [];
  return rawStickers
    .map((s: any, idx: number) => {
      const box = Array.isArray(s.box) && s.box.length === 4 ? s.box : null;
      const xmin = Number(box ? box[0] : s.xmin ?? 0);
      const ymin = Number(box ? box[1] : s.ymin ?? 0);
      const xmax = Number(box ? box[2] : s.xmax ?? 0);
      const ymax = Number(box ? box[3] : s.ymax ?? 0);
      const displayName =
        lang === "vi"
          ? s.name_vi || s.name || `Hình dán ${idx + 1}`
          : s.name || s.name_vi || `Sticker ${idx + 1}`;
      return {
        name: displayName,
        name_vi: s.name_vi || displayName,
        xmin: Math.max(0, Math.min(1000, xmin)),
        ymin: Math.max(0, Math.min(1000, ymin)),
        xmax: Math.max(0, Math.min(1000, xmax)),
        ymax: Math.max(0, Math.min(1000, ymax))
      };
    })
    .filter((s) => s.xmax > s.xmin + 10 && s.ymax > s.ymin + 10);
}

function buildFallbackStory(cName: string, fName: string, mode: string, lang: "en" | "vi", statusTag: string) {
  if (lang === "vi") {
    return {
      story: `Các con ơi, hôm nay cô sẽ kể cho bé ${cName} và bạn ${fName} nghe câu chuyện khu vườn sticker vui nhộn nhé!\n\nNgày xưa, trong một khu vườn ánh sáng do chính tay ${cName} và ${fName} sắp xếp, mỗi bạn nhỏ sticker đều ẩn chứa một phép màu riêng. Nhìn xem kìa, ở phía bên trái, các bạn nhỏ đang vẫy tay chào nhau dưới ánh nắng ấm áp! Chỉ cần ${cName} chạm nhẹ, những bông hoa và hàng cây xung quanh liền tỏa hương thơm ngát, mở ra một con đường nhỏ dẫn qua dòng suối xanh mát.\n\nỞ phía bên kia, các bạn thú nhỏ đáng yêu đang cùng nhau hợp sức bắc một nhịp cầu tình bạn. Mỗi bước chân đi qua đều phát ra những nốt nhạc vui tươi, biến những giọt sương sớm thành những viên kẹo ngọt ngào và trái cây chín đỏ.\n\nKhi ${fName} cùng ${cName} hô vang câu thần chú yêu thương, tất cả các nhân vật trên bàn cùng nắm tay nhau múa hát, dạy cho chúng mình biết rằng khi cùng nhau sẻ chia và giúp đỡ bạn bè, mọi thử thách đều trở thành cuộc phiêu lưu tuyệt vời nhất!`,
      stickers: [],
      lesson: `Chia sẻ phép màu và giúp đỡ bạn bè làm niềm vui nhân đôi! ${statusTag}`
    };
  }

  return {
    story: `Gather around, ${cName} and ${fName}! Today, let's explore the magical sticker world you built right on your table, where every little character holds a secret power!\n\nOnce upon a sunny morning, in the colorful landscape arranged by ${cName} and ${fName}, the little friends on the left side of the table woke up with a cheerful stretch. With a wave of a tiny magic wand, the trees and blossoms began to glow, lighting up a path toward the sparkling blue water.\n\nAcross the way, the brave little animal friends teamed up to build a sturdy bridge of kindness. Every time they helped each other cross over, golden stardust floated into the air, turning morning dew into sweet treats and ripe red apples for everyone to share!\n\nWhenever ${cName} and ${fName} clap their hands and say the magic words together, the whole sticker village comes alive with music and laughter—showing us that teamwork and kindness make every adventure twice as magical!`,
    stickers: [],
    lesson: `Sharing imagination and helping friends turns playtime into a magical adventure! ${statusTag}`
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, childName = "Bảo An", friendName = "Bo", mode = "magic", lang = "vi" } = req.body || {};
  const safeLang: "en" | "vi" = lang === "vi" ? "vi" : "en";
  const safeMode = ["funny", "teasing", "magic"].includes(mode) ? mode : "magic";
  const cName = sanitizeName(childName) || (safeLang === "en" ? "Leo" : "Bảo An");
  const fName = sanitizeName(friendName) || (safeLang === "en" ? "Mia" : "Bo");

  try {
    const rawKey = String(process.env.META_API_KEY || "")
      .trim()
      .replace(/^Bearer\s+/i, "")
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, "");

    if (!rawKey) {
      return res.status(200).json(buildFallbackStory(cName, fName, safeMode, safeLang, "(⚡ Missing Key)"));
    }

    // Chuẩn hóa định dạng khóa LLM_1501... cho tương thích chuẩn OpenAI /compat/v1/
    const candidateKeys = Array.from(new Set([rawKey, rawKey.replace(/^LLM_(\d+)_/, "LLM|$1|")]));
    const ENDPOINT = "https://api.llama.com/compat/v1/chat/completions";
    const modelName = "Llama-4-Maverick-17B-128E-Instruct-FP8";

    const storySystem =
      safeLang === "en"
        ? `You are a warm US Kindergarten Teacher. Ignore background text; analyze cartoon stickers. Write a 3-paragraph fairy tale. Return JSON: {"unsafe": false, "stickers": [{"name": "Dog", "xmin": 120, "ymin": 300, "xmax": 280, "ymax": 480}], "story": "...", "lesson": "..."}`
        : `Bạn là cô giáo mầm non ấm áp. Bỏ qua chữ viết nền; phân tích sticker. Viết truyện cổ tích 3 đoạn. Trả về JSON: {"unsafe": false, "stickers": [{"name": "Chó con", "xmin": 120, "ymin": 300, "xmax": 280, "ymax": 480}], "story": "...", "lesson": "..."}`;

    let successData: any = null;

    for (const activeKey of candidateKeys) {
      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: storySystem },
            {
              role: "user",
              content: [
                { type: "text", text: `Analyze all stickers in this photo with 0-1000 coordinates [xmin, ymin, xmax, ymax] and write a story for Child=${cName}, Friend=${fName}, Lang=${safeLang}.` },
                { type: "image_url", image_url: { url: imageBase64 } }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 1200
        })
      });

      const text = await resp.text();
      if (resp.ok) {
        successData = JSON.parse(text);
        break;
      }
    }

    if (!successData) {
      return res.status(200).json(buildFallbackStory(cName, fName, safeMode, safeLang, "(⚡ Meta Auth Error 401 - Using Backup Story)"));
    }

    const rawContent =
      successData.choices?.[0]?.message?.content ||
      successData.completion_message?.content?.text ||
      successData.completion_message?.content ||
      "";

    let parsed: any;
    try {
      parsed = extractJSONObject(String(rawContent));
    } catch {
      return res.status(200).json({
        story: String(rawContent),
        stickers: [],
        lesson: "✨ [META MODEL API LIVE]"
      });
    }

    const stickers = normalizeStickers(parsed.stickers, safeLang);

    return res.status(200).json({
      story: parsed.story || String(rawContent),
      stickers,
      lesson: `${parsed.lesson || "Chia sẻ giúp niềm vui nhân đôi!"} ✨ [META MODEL API LIVE]`
    });
  } catch {
    return res.status(200).json(buildFallbackStory(cName, fName, safeMode, safeLang, ""));
  }
}