import React from "react";

export default function RetakePopup({ reason, onRetry, lang }: { reason: string; onRetry?: () => void; lang: "en" | "vi" }) {
  const messages =
    lang === "en"
      ? {
          overlap: "Oh! Two stickers are overlapping (IoU > 0.2). Let's separate them a little bit and snap again!",
          blur: "The photo is a bit blurry. Let's hold steady and snap closer!",
          messy: "The table has some background clutter. Let's keep only cartoon stickers on a clean surface!"
        }
      : {
          overlap: "Ôi 2 miếng sticker dính sát vào nhau rồi (IoU > 0.2), mình tách ra một chút rồi chụp lại nhé!",
          blur: "Ảnh hơi mờ, mình giữ chắc tay và chụp gần hơn nhé!",
          messy: "Bàn hơi bừa, mình dọn sạch chỉ giữ lại các miếng sticker hoạt hình thôi nhé!"
        };

  const msg = reason === "overlap" ? messages.overlap : reason === "blur" ? messages.blur : messages.messy;
  const t = lang === "en" ? { title: "Let's Try Again!", btn: "📸 Retake Photo" } : { title: "Chụp lại nào!", btn: "📸 Chụp lại" };

  return (
    <div style={{ padding: 24, textAlign: "center", background: "#fff", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <h3 style={{ marginTop: 0 }}>{t.title}</h3>
      <p style={{ lineHeight: 1.5 }}>{msg}</p>
      <button onClick={onRetry} style={{ padding: "12px 20px", borderRadius: 10, background: "#000", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>
        {t.btn}
      </button>
    </div>
  );
}