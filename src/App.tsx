import React, { useState, useEffect } from "react";
import CameraCapture from "./ui/CameraCapture";
import RetakePopup from "./ui/RetakePopup";
import StoryReader from "./ui/StoryReader";
import { cropStickersFromMasks } from "./utils/crop";

async function saveStoryDualMode(entry: any) {
  try {
    const w = typeof window !== "undefined" ? (window as any) : undefined;
    if (w && w.FBInstant && w.FBInstant.player) {
      await w.FBInstant.player.setDataAsync({ lastStory: entry });
    } else if (typeof localStorage !== "undefined") {
      const prev = JSON.parse(localStorage.getItem("stikerry_bookshelf") || "[]");
      localStorage.setItem("stikerry_bookshelf", JSON.stringify([entry, ...prev].slice(0, 20)));
    }
  } catch {}
}

export default function App() {
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [childName, setChildName] = useState("Leo");
  const [friendName, setFriendName] = useState("Mia");
  const [mode, setMode] = useState<"funny" | "teasing" | "magic">("magic");
  const [step, setStep] = useState<"capture" | "loading" | "error" | "story">("capture");
  const [errorReason, setErrorReason] = useState("overlap");
  const [storyData, setStoryData] = useState<{ story: string; stickers: any[]; lesson?: string } | null>(null);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);

  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as any) : undefined;
    if (w && w.FBInstant) {
      w.FBInstant.initializeAsync().then(() => w.FBInstant.startGameAsync()).catch(() => {});
    }
  }, []);

  const handleCapture = async (base64: string) => {
    setStep("loading");
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, childName, friendName, mode, lang })
      });
      const data = await res.json();

      if (data.overlapError) {
        setErrorReason("overlap");
        setStep("error");
        return;
      }

      const boxes = (data.stickers || []).map((s: any) => [s.xmin || 0, s.ymin || 0, s.xmax || 1000, s.ymax || 1000]);
      const crops = await cropStickersFromMasks(base64, boxes);

      setStoryData(data);
      setCroppedImages(crops);
      await saveStoryDualMode({ story: data.story, lesson: data.lesson, ts: Date.now() });
      setStep("story");
    } catch {
      setErrorReason("messy");
      setStep("error");
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>✨ EduSticker (Stikerry)</h1>
        <button
          onClick={() => {
            const next = lang === "en" ? "vi" : "en";
            setLang(next);
            setChildName(next === "en" ? "Leo" : "Bảo An");
            setFriendName(next === "en" ? "Mia" : "Bo");
          }}
          style={{ padding: "6px 12px", borderRadius: 8, background: "#eee", border: "none", fontWeight: 600, cursor: "pointer" }}
        >
          {lang === "en" ? "🇺🇸 EN | 🇻🇳 VI" : "🇻🇳 VI | 🇺🇸 EN"}
        </button>
      </header>

      {step === "capture" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 14, fontWeight: 600 }}>
            {lang === "en" ? "Child's First Name:" : "Tên của bé:"}
            <input value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={15} style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 14, fontWeight: 600 }}>
            {lang === "en" ? "Friend's First Name:" : "Tên bạn cùng chơi:"}
            <input value={friendName} onChange={(e) => setFriendName(e.target.value)} maxLength={15} style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc", marginTop: 4 }} />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {(["funny", "teasing", "magic"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  borderRadius: 8,
                  border: mode === m ? "2px solid #000" : "1px solid #ccc",
                  background: mode === m ? "#000" : "#fff",
                  color: mode === m ? "#fff" : "#000",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {m === "funny" ? (lang === "en" ? "😂 Silly & Funny" : "😂 Vui Nhộn") : m === "teasing" ? (lang === "en" ? "😜 Playful Tease" : "😜 Hơi Trêu") : (lang === "en" ? "✨ Magic & Wonder" : "✨ Phép Thuật")}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <CameraCapture onCapture={handleCapture} lang={lang} />
          </div>
        </div>
      )}

      {step === "loading" && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>
            {lang === "en" ? "✨ Kindergarten Teacher is reading your stickers and crafting a story..." : "✨ Đang nhờ cô giáo nhìn sticker và kể chuyện cho bé..."}
          </p>
        </div>
      )}

      {step === "error" && <RetakePopup reason={errorReason} onRetry={() => setStep("capture")} lang={lang} />}

      {step === "story" && storyData && (
        <StoryReader story={storyData.story} stickers={storyData.stickers} crops={croppedImages} lesson={storyData.lesson} lang={lang} />
      )}
    </div>
  );
}