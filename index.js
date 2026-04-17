import { useState, useEffect, useRef, useCallback } from "react";

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

// Approximate CNY rates (CNY base)
const CNY_RATES = {
  KES: 18.7, USD: 0.138, EUR: 0.127, GBP: 0.109,
  NGN: 220.4, ZAR: 2.51, GHS: 2.06, JPY: 20.8,
  AUD: 0.213, CAD: 0.190, INR: 11.5, CNY: 1,
};

// Sample Chinese product texts for the demo
const DEMO_TEXTS = [
  {
    id: 1,
    site: "Taobao",
    items: [
      { text: "女士真丝连衣裙夏季新款", price: "¥268", type: "product" },
      { text: "纯棉男士短袖T恤大码", price: "¥89", type: "product" },
      { text: "儿童运动鞋防滑透气", price: "¥159", type: "product" },
      { text: "无线蓝牙耳机降噪音乐", price: "¥399", type: "product" },
      { text: "厨房不锈钢炒锅32cm", price: "¥128", type: "product" },
      { text: "有机绿茶500g礼盒装", price: "¥76", type: "product" },
    ]
  },
  {
    id: 2,
    site: "1688",
    items: [
      { text: "批发定制印花棉布料按米", price: "¥12/m", type: "wholesale" },
      { text: "塑料收纳盒透明储物箱", price: "¥8.5", type: "wholesale" },
      { text: "手机壳批发苹果华为通用", price: "¥3.2", type: "wholesale" },
      { text: "LED灯带5米装室内装饰", price: "¥22", type: "wholesale" },
      { text: "棉麻帆布手提包女单肩", price: "¥18", type: "wholesale" },
      { text: "不锈钢餐具套装10件组", price: "¥45", type: "wholesale" },
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
        content: `Translate this Chinese product/text to English. Reply with ONLY the English translation, nothing else, no explanation:\n\n${text}`
      }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "Translation unavailable";
}

// --- ProductCard Component ---
function ProductCard({ item, targetCurrency, autoTranslate }) {
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [converted, setConverted] = useState(null);

  useEffect(() => {
    const cnyAmt = extractCNYPrice(item.price);
    if (cnyAmt) {
      setConverted(convertCurrency(cnyAmt, targetCurrency));
    }
  }, [item.price, targetCurrency]);

  useEffect(() => {
    if (autoTranslate && !translation && !loading) {
      doTranslate();
    }
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

  const cnyAmount = extractCNYPrice(item.price);
  const sym = getCurrencySymbol(targetCurrency);

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-image">
        <div className="img-placeholder">
          <span className="img-icon">🛍</span>
        </div>
        {(loading) && (
          <div className="translating-badge">
            <span className="spin">⟳</span> Translating…
          </div>
        )}
        {translation && showBubble && (
          <div className="bubble-overlay">
            <div className="bubble-arrow" />
            <div className="bubble-content">
              <span className="bubble-label">EN</span>
              <span className="bubble-text">{translation}</span>
            </div>
          </div>
        )}
      </div>
      <div className="product-info">
        <p className="chinese-text">{item.text}</p>
        {translation && showBubble && (
          <p className="english-text">📝 {translation}</p>
        )}
        <div className="price-row">
          <span className="cny-price">{item.price}</span>
          {converted && cnyAmount && (
            <span className="converted-price">
              ≈ {sym}{converted} {targetCurrency}
            </span>
          )}
        </div>
        {!translation && !loading && (
          <button className="tap-hint">Tap to translate</button>
        )}
      </div>
    </div>
  );
}

// --- Main App ---
export default function BubbleTranslate() {
  const [targetCurrency, setTargetCurrency] = useState("KES");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [activeSite, setActiveSite] = useState(0);
  const [manualText, setManualText] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("browse"); // browse | translate | converter

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
  const sym = getCurrencySymbol(targetCurrency);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0d0e14;
          --surface: #15161f;
          --surface2: #1c1e2a;
          --border: #2a2d3e;
          --accent: #4fffb0;
          --accent2: #ff6b6b;
          --accent3: #ffd166;
          --text: #e8eaf6;
          --muted: #7b7fa0;
          --chinese: #ffb347;
          --radius: 14px;
        }

        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

        .app {
          min-height: 100vh;
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }

        /* HEADER */
        .header {
          padding: 20px 20px 0;
          background: linear-gradient(180deg, #0d0e14 0%, transparent 100%);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--accent), #00c8ff);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 20px rgba(79,255,176,0.3);
        }
        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          background: linear-gradient(90deg, var(--accent), #00c8ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo-sub {
          font-size: 10px;
          color: var(--muted);
          margin-top: -2px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Currency selector */
        .currency-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: border-color 0.2s;
        }
        .currency-pill:hover { border-color: var(--accent); }
        .currency-pill select {
          background: none;
          border: none;
          color: var(--accent3);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          -webkit-appearance: none;
        }
        .currency-pill select option { background: #1c1e2a; color: var(--text); }

        /* Auto-translate toggle */
        .auto-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 14px;
        }
        .auto-label {
          font-size: 12px;
          color: var(--muted);
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .toggle {
          width: 42px; height: 22px;
          background: var(--border);
          border-radius: 11px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
          border: none;
          outline: none;
        }
        .toggle.on { background: var(--accent); }
        .toggle::after {
          content: '';
          position: absolute;
          width: 16px; height: 16px;
          background: white;
          border-radius: 50%;
          top: 3px; left: 3px;
          transition: transform 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .toggle.on::after { transform: translateX(20px); }

        /* TABS */
        .tabs {
          display: flex;
          gap: 4px;
          padding: 0 20px 16px;
          background: var(--bg);
        }
        .tab-btn {
          flex: 1;
          padding: 8px 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--muted);
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .tab-btn.active {
          background: var(--surface2);
          border-color: var(--accent);
          color: var(--accent);
        }

        /* CONTENT */
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 0 20px 100px;
        }

        /* SITE SELECTOR */
        .site-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .site-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .site-btn.active {
          border-color: var(--accent2);
          color: var(--accent2);
          background: rgba(255,107,107,0.08);
        }

        /* PRODUCT GRID */
        .product-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .product-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
          position: relative;
        }
        .product-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .product-card:active { transform: scale(0.98); }

        .product-image {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
          overflow: hidden;
        }
        .img-placeholder {
          width: 100%; height: 100%;
          background: linear-gradient(135deg, var(--surface2) 0%, #1a1c28 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .img-icon { font-size: 36px; opacity: 0.5; }

        .translating-badge {
          position: absolute;
          top: 6px; left: 6px;
          background: rgba(0,0,0,0.85);
          color: var(--accent);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 20px;
          display: flex; align-items: center; gap: 4px;
          backdrop-filter: blur(4px);
          border: 1px solid var(--accent);
        }
        .spin { display: inline-block; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bubble-overlay {
          position: absolute;
          bottom: 6px; left: 6px; right: 6px;
          background: rgba(10, 11, 18, 0.92);
          border: 1px solid var(--accent);
          border-radius: 8px;
          padding: 7px 9px;
          backdrop-filter: blur(8px);
          animation: bubblePop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 0 16px rgba(79,255,176,0.2);
        }
        @keyframes bubblePop {
          from { opacity: 0; transform: scale(0.85) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .bubble-label {
          display: inline-block;
          background: var(--accent);
          color: #000;
          font-size: 9px;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          padding: 1px 5px;
          border-radius: 4px;
          margin-bottom: 3px;
          letter-spacing: 0.08em;
        }
        .bubble-text {
          display: block;
          font-size: 10px;
          color: var(--text);
          line-height: 1.4;
        }

        .product-info {
          padding: 10px;
        }
        .chinese-text {
          font-size: 12px;
          color: var(--chinese);
          line-height: 1.4;
          margin-bottom: 4px;
          font-weight: 500;
        }
        .english-text {
          font-size: 10px;
          color: var(--muted);
          margin-bottom: 6px;
          line-height: 1.3;
          font-style: italic;
        }
        .price-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cny-price {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: var(--accent2);
        }
        .converted-price {
          font-size: 11px;
          color: var(--accent3);
          font-weight: 600;
        }
        .tap-hint {
          margin-top: 6px;
          background: none;
          border: 1px dashed var(--border);
          color: var(--muted);
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .tap-hint:hover { border-color: var(--accent); color: var(--accent); }

        /* MANUAL TRANSLATE TAB */
        .translate-section {
          padding: 4px 0;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .input-area {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px;
          color: var(--text);
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          min-height: 120px;
        }
        .input-area::placeholder { color: var(--muted); }
        .input-area:focus { border-color: var(--accent); }

        .translate-btn {
          width: 100%;
          margin-top: 10px;
          padding: 14px;
          background: linear-gradient(135deg, var(--accent), #00c8ff);
          color: #000;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          letter-spacing: 0.06em;
          transition: opacity 0.2s, transform 0.1s;
        }
        .translate-btn:hover { opacity: 0.9; }
        .translate-btn:active { transform: scale(0.98); }
        .translate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .result-box {
          margin-top: 14px;
          background: var(--surface);
          border: 1px solid var(--accent);
          border-radius: var(--radius);
          padding: 16px;
          animation: bubblePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .result-lang {
          display: inline-block;
          background: var(--accent);
          color: #000;
          font-size: 10px;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          padding: 2px 8px;
          border-radius: 5px;
          margin-bottom: 10px;
          letter-spacing: 0.08em;
        }
        .result-text {
          font-size: 16px;
          color: var(--text);
          line-height: 1.6;
          font-weight: 300;
        }

        /* CONVERTER TAB */
        .converter-section {}
        .converter-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          margin-bottom: 12px;
        }
        .converter-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .amount-input {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          color: var(--text);
          font-size: 22px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          outline: none;
          transition: border-color 0.2s;
        }
        .amount-input:focus { border-color: var(--accent); }
        .amount-input::placeholder { color: var(--muted); font-weight: 400; font-size: 16px; }

        .arrow-divider {
          text-align: center;
          font-size: 20px;
          color: var(--accent);
          margin: 4px 0;
        }

        .result-amount {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: var(--accent3);
          margin-top: 4px;
        }
        .rate-note {
          font-size: 11px;
          color: var(--muted);
          margin-top: 6px;
        }

        .quick-amounts {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .quick-btn {
          padding: 6px 14px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text);
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-btn:hover { border-color: var(--accent3); color: var(--accent3); }

        .target-select {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          color: var(--text);
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          cursor: pointer;
        }
        .target-select:focus { border-color: var(--accent); }
        .target-select option { background: #1c1e2a; }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>

      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div className="logo">
              <div className="logo-icon">🌐</div>
              <div>
                <div className="logo-text">BubbleLens</div>
                <div className="logo-sub">Chinese → English</div>
              </div>
            </div>
            <div className="currency-pill">
              <span>💱</span>
              <select value={targetCurrency} onChange={e => setTargetCurrency(e.target.value)}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeTab === "browse" && (
            <div className="auto-row">
              <span className="auto-label">⚡ Auto-translate all items on load</span>
              <button
                className={`toggle ${autoTranslate ? "on" : ""}`}
                onClick={() => setAutoTranslate(v => !v)}
              />
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === "browse" ? "active" : ""}`} onClick={() => setActiveTab("browse")}>
            🛒 Browse
          </button>
          <button className={`tab-btn ${activeTab === "translate" ? "active" : ""}`} onClick={() => setActiveTab("translate")}>
            🌐 Translate
          </button>
          <button className={`tab-btn ${activeTab === "converter" ? "active" : ""}`} onClick={() => setActiveTab("converter")}>
            💱 Convert
          </button>
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* BROWSE TAB */}
          {activeTab === "browse" && (
            <>
              <div className="site-selector">
                {DEMO_TEXTS.map((s, i) => (
                  <button
                    key={s.id}
                    className={`site-btn ${activeSite === i ? "active" : ""}`}
                    onClick={() => setActiveSite(i)}
                  >
                    {s.site}
                  </button>
                ))}
              </div>
              <div className="product-grid">
                {site.items.map((item, i) => (
                  <ProductCard
                    key={`${site.id}-${i}`}
                    item={item}
                    targetCurrency={targetCurrency}
                    autoTranslate={autoTranslate}
                  />
                ))}
              </div>
            </>
          )}

          {/* TRANSLATE TAB */}
          {activeTab === "translate" && (
            <div className="translate-section">
              <div className="section-title">Paste Chinese Text</div>
              <textarea
                className="input-area"
                placeholder={"粘贴中文文字...\n\nPaste any Chinese text here — product names, descriptions, messages, prices..."}
                value={manualText}
                onChange={e => setManualText(e.target.value)}
              />
              <button
                className="translate-btn"
                disabled={manualLoading || !manualText.trim()}
                onClick={handleManualTranslate}
              >
                {manualLoading ? "Translating…" : "TRANSLATE →"}
              </button>
              {manualResult && (
                <div className="result-box">
                  <span className="result-lang">ENGLISH</span>
                  <div className="result-text">{manualResult}</div>
                </div>
              )}
            </div>
          )}

          {/* CONVERTER TAB */}
          {activeTab === "converter" && (
            <ConverterTab targetCurrency={targetCurrency} setTargetCurrency={setTargetCurrency} />
          )}
        </div>
      </div>
    </>
  );
}

function ConverterTab({ targetCurrency, setTargetCurrency }) {
  const [amount, setAmount] = useState("");

  const converted = amount
    ? convertCurrency(parseFloat(amount) || 0, targetCurrency)
    : null;

  const rate = CNY_RATES[targetCurrency];
  const sym = getCurrencySymbol(targetCurrency);

  return (
    <div className="converter-section">
      <div className="converter-card">
        <div className="converter-label">Chinese Yuan (CNY ¥)</div>
        <input
          type="number"
          className="amount-input"
          placeholder="Enter ¥ amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <div className="quick-amounts">
          {[10, 50, 100, 500, 1000].map(v => (
            <button key={v} className="quick-btn" onClick={() => setAmount(String(v))}>
              ¥{v}
            </button>
          ))}
        </div>
      </div>

      <div className="arrow-divider">⬇</div>

      <div className="converter-card">
        <div className="converter-label">Convert To</div>
        <select
          className="target-select"
          value={targetCurrency}
          onChange={e => setTargetCurrency(e.target.value)}
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code}) {c.symbol}
            </option>
          ))}
        </select>
        {converted !== null && amount && (
          <>
            <div className="result-amount">{sym}{converted} {targetCurrency}</div>
            <div className="rate-note">1 CNY ≈ {rate} {targetCurrency} · Approximate rate</div>
          </>
        )}
        {(!amount || !converted) && (
          <div className="rate-note" style={{marginTop: 12}}>1 CNY ≈ {rate} {targetCurrency}</div>
        )}
      </div>
    </div>
  );
}
