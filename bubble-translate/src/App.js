import { useState, useEffect } from "react";

const CURRENCIES = [
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];

const CNY_RATES = {
  KES: 18.7, USD: 0.138, EUR: 0.127, GBP: 0.109,
  NGN: 220.4, ZAR: 2.51, GHS: 2.06, JPY: 20.8,
  AUD: 0.213, CAD: 0.190, INR: 11.5, CNY: 1,
};

const DEMO_TEXTS = [
  {
    id: 1, site: "Taobao",
    items: [
      { text: "女士真丝连衣裙夏季新款", price: "¥268", emoji: "👗" },
      { text: "纯棉男士短袖T恤大码", price: "¥89", emoji: "👕" },
      { text: "儿童运动鞋防滑透气", price: "¥159", emoji: "👟" },
      { text: "无线蓝牙耳机降噪音乐", price: "¥399", emoji: "🎧" },
      { text: "厨房不锈钢炒锅32cm", price: "¥128", emoji: "🍳" },
      { text: "有机绿茶500g礼盒装", price: "¥76", emoji: "🍵" },
    ]
  },
  {
    id: 2, site: "1688",
    items: [
      { text: "批发定制印花棉布料按米", price: "¥12/m", emoji: "🧵" },
      { text: "塑料收纳盒透明储物箱", price: "¥8.5", emoji: "📦" },
      { text: "手机壳批发苹果华为通用", price: "¥3.2", emoji: "📱" },
      { text: "LED灯带5米装室内装饰", price: "¥22", emoji: "💡" },
      { text: "棉麻帆布手提包女单肩", price: "¥18", emoji: "👜" },
      { text: "不锈钢餐具套装10件组", price: "¥45", emoji: "🍴" },
    ]
  }
];

function extractCNYPrice(priceStr) {
  const match = priceStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function convertCurrency(cnyAmount, targetCurrency) {
  const rate = CNY_RATES[targetCurrency] || 1;
  return (cnyAmount * rate).toFixed(2);
}

function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
}

async function translateText(text) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Translate this Chinese product/text to English. Reply with ONLY the English translation, nothing else:\n\n${text}`
      }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "Translation unavailable";
}

function ProductCard({ item, targetCurrency, autoTranslate }) {
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  const cnyAmount = extractCNYPrice(item.price);
  const converted = cnyAmount ? convertCurrency(cnyAmount, targetCurrency) : null;
  const sym = getCurrencySymbol(targetCurrency);

  useEffect(() => {
    if (autoTranslate && !translation && !loading) doTranslate();
    // eslint-disable-next-line
  }, [autoTranslate]);

  const doTranslate = async () => {
    if (translation || loading) return;
    setLoading(true);
    try {
      const t = await translateText(item.text);
      setTranslation(t);
      setShowBubble(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!translation) doTranslate();
    else setShowBubble(v => !v);
  };

  return (
    <div onClick={handleClick} style={{
      background: "#15161f", border: `1px solid ${translation && showBubble ? "#4fffb0" : "#2a2d3e"}`,
      borderRadius: 14, overflow: "hidden", cursor: "pointer",
      transition: "border-color 0.2s, transform 0.15s",
    }}>
      {/* Image area */}
      <div style={{ position: "relative", aspectRatio: "1", background: "linear-gradient(135deg, #1c1e2a, #1a1c28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 44, opacity: 0.7 }}>{item.emoji}</span>

        {loading && (
          <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.85)", color: "#4fffb0", fontSize: 10, padding: "3px 8px", borderRadius: 20, border: "1px solid #4fffb0", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span> Translating…
          </div>
        )}

        {translation && showBubble && (
          <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, background: "rgba(10,11,18,0.93)", border: "1px solid #4fffb0", borderRadius: 8, padding: "7px 9px", backdropFilter: "blur(8px)", boxShadow: "0 0 16px rgba(79,255,176,0.2)", animation: "bubblePop 0.25s ease" }}>
            <span style={{ display: "inline-block", background: "#4fffb0", color: "#000", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, marginBottom: 3, letterSpacing: "0.08em" }}>EN</span>
            <div style={{ fontSize: 10, color: "#e8eaf6", lineHeight: 1.4 }}>{translation}</div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: 10 }}>
        <p style={{ fontSize: 12, color: "#ffb347", lineHeight: 1.4, marginBottom: 4, fontWeight: 500 }}>{item.text}</p>
        {translation && showBubble && (
          <p style={{ fontSize: 10, color: "#7b7fa0", marginBottom: 6, lineHeight: 1.3, fontStyle: "italic" }}>📝 {translation}</p>
        )}
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#ff6b6b" }}>{item.price}</div>
          {converted && <div style={{ fontSize: 11, color: "#ffd166", fontWeight: 600 }}>≈ {sym}{converted} {targetCurrency}</div>}
        </div>
        {!translation && !loading && (
          <div style={{ marginTop: 6, border: "1px dashed #2a2d3e", color: "#7b7fa0", fontSize: 10, padding: "4px 8px", borderRadius: 6, textAlign: "center" }}>
            Tap to translate
          </div>
        )}
      </div>
    </div>
  );
}

function ConverterTab({ targetCurrency, setTargetCurrency }) {
  const [amount, setAmount] = useState("");
  const rate = CNY_RATES[targetCurrency];
  const sym = getCurrencySymbol(targetCurrency);
  const converted = amount ? (parseFloat(amount) * rate).toFixed(2) : null;

  return (
    <div>
      <div style={{ background: "#15161f", border: "1px solid #2a2d3e", borderRadius: 14, padding: 20, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#7b7fa0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>Chinese Yuan (CNY ¥)</div>
        <input
          type="number"
          placeholder="Enter ¥ amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: "100%", background: "#1c1e2a", border: "1px solid #2a2d3e", borderRadius: 10, padding: "12px 14px", color: "#e8eaf6", fontSize: 22, fontWeight: 700, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {[10, 50, 100, 500, 1000].map(v => (
            <button key={v} onClick={() => setAmount(String(v))} style={{ padding: "6px 14px", background: "#1c1e2a", border: "1px solid #2a2d3e", borderRadius: 20, color: "#e8eaf6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              ¥{v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 20, color: "#4fffb0", margin: "4px 0" }}>⬇</div>

      <div style={{ background: "#15161f", border: "1px solid #2a2d3e", borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 11, color: "#7b7fa0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>Convert To</div>
        <select
          value={targetCurrency}
          onChange={e => setTargetCurrency(e.target.value)}
          style={{ width: "100%", background: "#1c1e2a", border: "1px solid #2a2d3e", borderRadius: 10, padding: "12px 14px", color: "#e8eaf6", fontSize: 15, outline: "none", cursor: "pointer" }}
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.name} ({c.code}) {c.symbol}</option>
          ))}
        </select>
        {converted && amount && (
          <>
            <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 800, color: "#ffd166", marginTop: 12 }}>{sym}{converted} {targetCurrency}</div>
            <div style={{ fontSize: 11, color: "#7b7fa0", marginTop: 4 }}>1 CNY ≈ {rate} {targetCurrency} · Approximate rate</div>
          </>
        )}
        {!amount && <div style={{ fontSize: 11, color: "#7b7fa0", marginTop: 10 }}>1 CNY ≈ {rate} {targetCurrency}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [targetCurrency, setTargetCurrency] = useState("KES");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [activeSite, setActiveSite] = useState(0);
  const [manualText, setManualText] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  const handleManualTranslate = async () => {
    if (!manualText.trim()) return;
    setManualLoading(true);
    setManualResult(null);
    try {
      const t = await translateText(manualText);
      setManualResult(t);
    } finally {
      setManualLoading(false);
    }
  };

  const site = DEMO_TEXTS[activeSite];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0e14", color: "#e8eaf6", fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #0d0e14; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bubblePop { from { opacity: 0; transform: scale(0.85) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        select option { background: #1c1e2a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 2px; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "20px 20px 0", position: "sticky", top: 0, background: "#0d0e14", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #4fffb0, #00c8ff)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 0 20px rgba(79,255,176,0.3)" }}>🌐</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(90deg, #4fffb0, #00c8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BubbleLens</div>
              <div style={{ fontSize: 10, color: "#7b7fa0", letterSpacing: "0.08em", textTransform: "uppercase" }}>Chinese → English</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1c1e2a", border: "1px solid #2a2d3e", borderRadius: 20, padding: "6px 12px" }}>
            <span>💱</span>
            <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)} style={{ background: "none", border: "none", color: "#ffd166", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
            </select>
          </div>
        </div>

        {activeTab === "browse" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#15161f", border: "1px solid #2a2d3e", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#7b7fa0", fontWeight: 500 }}>⚡ Auto-translate all items</span>
            <button onClick={() => setAutoTranslate(v => !v)} style={{ width: 42, height: 22, background: autoTranslate ? "#4fffb0" : "#2a2d3e", borderRadius: 11, position: "relative", cursor: "pointer", transition: "background 0.3s", border: "none", outline: "none" }}>
              <span style={{ position: "absolute", width: 16, height: 16, background: "white", borderRadius: "50%", top: 3, left: 3, transition: "transform 0.3s", transform: autoTranslate ? "translateX(20px)" : "none", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
            </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, padding: "0 20px 16px", background: "#0d0e14" }}>
        {[["browse", "🛒 Browse"], ["translate", "🌐 Translate"], ["converter", "💱 Convert"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: "8px 4px", background: activeTab === id ? "#1c1e2a" : "#15161f", border: `1px solid ${activeTab === id ? "#4fffb0" : "#2a2d3e"}`, borderRadius: 10, color: activeTab === id ? "#4fffb0" : "#7b7fa0", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>

        {activeTab === "browse" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {DEMO_TEXTS.map((s, i) => (
                <button key={s.id} onClick={() => setActiveSite(i)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${activeSite === i ? "#ff6b6b" : "#2a2d3e"}`, background: activeSite === i ? "rgba(255,107,107,0.08)" : "#15161f", color: activeSite === i ? "#ff6b6b" : "#7b7fa0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {s.site}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {site.items.map((item, i) => (
                <ProductCard key={`${site.id}-${i}`} item={item} targetCurrency={targetCurrency} autoTranslate={autoTranslate} />
              ))}
            </div>
          </>
        )}

        {activeTab === "translate" && (
          <div>
            <div style={{ fontSize: 13, color: "#7b7fa0", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Paste Chinese Text</div>
            <textarea
              style={{ width: "100%", background: "#15161f", border: "1px solid #2a2d3e", borderRadius: 14, padding: 14, color: "#e8eaf6", fontSize: 15, fontFamily: "inherit", resize: "none", outline: "none", minHeight: 120 }}
              placeholder={"粘贴中文文字...\n\nPaste any Chinese text here — product names, descriptions, messages..."}
              value={manualText}
              onChange={e => setManualText(e.target.value)}
            />
            <button
              disabled={manualLoading || !manualText.trim()}
              onClick={handleManualTranslate}
              style={{ width: "100%", marginTop: 10, padding: 14, background: "linear-gradient(135deg, #4fffb0, #00c8ff)", color: "#000", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 14, cursor: "pointer", opacity: manualLoading || !manualText.trim() ? 0.5 : 1, letterSpacing: "0.06em" }}
            >
              {manualLoading ? "Translating…" : "TRANSLATE →"}
            </button>
            {manualResult && (
              <div style={{ marginTop: 14, background: "#15161f", border: "1px solid #4fffb0", borderRadius: 14, padding: 16, animation: "bubblePop 0.3s ease" }}>
                <span style={{ display: "inline-block", background: "#4fffb0", color: "#000", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5, marginBottom: 10, letterSpacing: "0.08em" }}>ENGLISH</span>
                <div style={{ fontSize: 16, color: "#e8eaf6", lineHeight: 1.6, fontWeight: 300 }}>{manualResult}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "converter" && (
          <ConverterTab targetCurrency={targetCurrency} setTargetCurrency={setTargetCurrency} />
        )}
      </div>
    </div>
  );
}
