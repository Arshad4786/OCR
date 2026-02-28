"use client";
import { useState } from 'react';
import Tesseract from 'tesseract.js';
import imageCompression from 'browser-image-compression';

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isHandwritten, setIsHandwritten] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        alert("For this MVP, please upload an image file (JPEG/PNG). PDF multi-page support is mapped out for V2!");
        event.target.value = '';
        return;
      }
      try {
        setProgress("Optimizing image resolution...");
        const options = {
          maxSizeMB: 2.5,
          maxWidthOrHeight: 2048,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        setImagePath(URL.createObjectURL(compressedFile));
        setExtractedText("");
        setIsCopied(false);
        setProgress("");
      } catch (error) {
        console.error("Compression error:", error);
        setExtractedText("Error loading image. Please try a different file.");
        setProgress("");
      }
    }
  };

  const handleExtractText = async () => {
    if (!imagePath || !imageFile) return;
    setIsProcessing(true);
    setProgress("Starting extraction...");

    if (!isHandwritten) {
      Tesseract.recognize(imagePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`Processing: ${Math.round(m.progress * 100)}%`);
          }
        }
      }).then(({ data }) => {
        const { text, confidence } = data;
        if (confidence < 55 || text.trim().length < 3) {
          setExtractedText("No clear printed text was detected in this image.");
        } else {
          setExtractedText(text);
        }
        setIsProcessing(false);
        setProgress("");
      }).catch((err) => {
        console.error(err);
        setExtractedText("Error extracting text.");
        setIsProcessing(false);
        setProgress("");
      });
    } else {
      setProgress("Sending to secure AI Vision Backend...");
      try {
        const response = await fetch("/api/ocr", {
          method: "POST",
          body: imageFile,
        });
        const result = await response.json();
        if (!response.ok) {
          setExtractedText(result.error || "Backend error occurred.");
        } else if (result.generated_text) {
          setExtractedText(result.generated_text);
        } else {
          setExtractedText("AI could not read this handwriting clearly.");
        }
      } catch (error) {
        console.error("Frontend Fetch Error:", error);
        setExtractedText("Network error. Please check your connection and try again.");
      } finally {
        setIsProcessing(false);
        setProgress("");
      }
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0a0a0f;
          --paper: #f5f3ee;
          --accent: #e8441a;
          --accent-dark: #c23510;
          --muted: #9e9b94;
          --border: #ddd9d0;
          --card: #ffffff;
          --ink-light: #3d3c38;
        }

        body {
          font-family: 'Syne', sans-serif;
          background-color: var(--paper);
          color: var(--ink);
          min-height: 100vh;
        }

        /* NAV */
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--ink);
          border-bottom: 1px solid #1e1e28;
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 32px;
          height: 32px;
          background: var(--accent);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-logo-text {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .nav-logo-text span { color: var(--accent); }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          list-style: none;
        }
        .nav-links a {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #a0a0b0;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: #fff; }
        .nav-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          border: 1px solid var(--accent);
          padding: 3px 8px;
          border-radius: 4px;
        }

        /* HERO */
        .hero {
          background: var(--ink);
          padding: 5rem 2rem 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,68,26,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          border: 1px solid rgba(232,68,26,0.3);
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 1.5rem;
          background: rgba(232,68,26,0.08);
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.0;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .hero-title span {
          color: var(--accent);
          display: block;
        }
        .hero-sub {
          font-size: 1rem;
          color: #6b6b80;
          max-width: 480px;
          margin: 0 auto 0.5rem;
          line-height: 1.7;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
        }
        .hero-engines {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .engine-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #8080a0;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 5px 12px;
          border-radius: 6px;
        }
        .engine-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px #4ade80;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* MAIN CONTENT */
        .main {
          max-width: 780px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }

        /* ENGINE TOGGLE */
        .toggle-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .toggle-info { display: flex; flex-direction: column; gap: 2px; }
        .toggle-label {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .toggle-active-engine {
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink);
        }
        .toggle-active-engine span { color: var(--accent); }
        .toggle-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toggle-option {
          font-size: 0.8rem;
          font-weight: 600;
          transition: color 0.2s;
        }
        .toggle-option.active { color: var(--accent); }
        .toggle-option.inactive { color: var(--muted); }
        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          background: var(--border);
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: background 0.3s;
          outline: none;
        }
        .toggle-switch.on { background: var(--accent); }
        .toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .toggle-thumb.on { transform: translateX(24px); }

        /* UPLOAD ZONE */
        .upload-card {
          background: var(--card);
          border: 2px dashed var(--border);
          border-radius: 16px;
          padding: 3rem 2rem;
          margin-bottom: 1.5rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
          text-align: center;
        }
        .upload-card:hover {
          border-color: var(--accent);
          background: rgba(232,68,26,0.02);
        }
        .upload-card input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        .upload-icon-wrap {
          width: 64px;
          height: 64px;
          background: var(--paper);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }
        .upload-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 0.4rem;
        }
        .upload-title span { color: var(--accent); }
        .upload-sub {
          font-size: 0.8rem;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
        }

        /* PREVIEW */
        .preview-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .preview-header {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--paper);
        }
        .preview-header-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .preview-img-wrap {
          padding: 1.5rem;
          display: flex;
          justify-content: center;
          background: #fafaf8;
        }
        .preview-img {
          max-height: 280px;
          max-width: 100%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .preview-footer {
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-top: 1px solid var(--border);
        }
        .extract-btn {
          flex: 1;
          height: 48px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 2px 12px rgba(232,68,26,0.25);
        }
        .extract-btn:hover:not(:disabled) {
          background: var(--accent-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(232,68,26,0.35);
        }
        .extract-btn:active:not(:disabled) { transform: translateY(0); }
        .extract-btn:disabled {
          background: var(--muted);
          cursor: not-allowed;
          box-shadow: none;
        }
        .progress-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--accent);
          font-family: 'DM Mono', monospace;
          min-width: 150px;
        }
        .progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 1s infinite;
          flex-shrink: 0;
        }

        /* RESULTS */
        .results-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          animation: fadeUp 0.4s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .results-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--paper);
        }
        .results-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-light);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .results-badge {
          background: var(--ink);
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Syne', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          background: var(--ink);
          color: white;
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .copy-btn:hover { background: #1e1e2e; }
        .copy-btn.copied { background: #16a34a; }
        .results-body {
          padding: 1.5rem;
          background: #fafaf8;
        }
        .results-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
          font-weight: 400;
          line-height: 1.8;
          color: var(--ink-light);
          white-space: pre-wrap;
        }

        /* SECTION DIVIDER */
        .section-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* FOOTER */
        .footer {
          background: var(--ink);
          padding: 3rem 2rem 2rem;
          margin-top: 0;
        }
        .footer-inner {
          max-width: 780px;
          margin: 0 auto;
        }
        .footer-top {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #1e1e28;
          margin-bottom: 2rem;
        }
        .footer-brand-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }
        .footer-brand-name span { color: var(--accent); }
        .footer-brand-desc {
          font-size: 0.78rem;
          color: #5c5c70;
          line-height: 1.6;
          font-family: 'DM Mono', monospace;
          font-weight: 300;
        }
        .footer-col-title {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5c5c70;
          margin-bottom: 0.75rem;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .footer-links a {
          font-size: 0.82rem;
          color: #6b6b80;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #fff; }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .footer-copy {
          font-size: 0.72rem;
          color: #3d3d50;
          font-family: 'DM Mono', monospace;
        }
        .footer-stack {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stack-pill {
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #4d4d60;
          border: 1px solid #2a2a38;
          padding: 3px 9px;
          border-radius: 4px;
        }

        @media (max-width: 640px) {
          .nav-links { display: none; }
          .footer-top { grid-template-columns: 1fr; }
          .toggle-card { flex-direction: column; gap: 1rem; align-items: flex-start; }
          .hero { padding: 3rem 1.25rem 2.5rem; }
        }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className="nav">
        <a href="https://github.com/Arshad4786/OCR" target="_blank" rel="noopener noreferrer" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span className="nav-logo-text">OCR<span>AI</span></span>
        </a>
        <ul className="nav-links">
          <li><a href="https://github.com/Arshad4786/OCR#readme" target="_blank" rel="noopener noreferrer">How it works</a></li>
          <li><a href="https://tesseract.projectnaptha.com/" target="_blank" rel="noopener noreferrer">Engines</a></li>
          <li><a href="https://console.groq.com/docs/models" target="_blank" rel="noopener noreferrer">Docs</a></li>
          <li><span className="nav-badge">v1 MVP</span></li>
        </ul>
      </nav>

      {/* ═══ HERO ═══ */}
      <header className="hero">
        <div className="hero-tag">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4"/></svg>
          Hybrid OCR Engine — Live
        </div>
        <h1 className="hero-title">
          Extract text.<br/>
          <span>Any format.</span>
        </h1>
        <p className="hero-sub">
          Printed docs run locally via Tesseract.<br/>
          Handwriting routes through Llama Scout Vision AI.
        </p>
        <div className="hero-engines">
          <div className="engine-pill">
            <div className="engine-dot"></div>
            Tesseract OCR
          </div>
          <div className="engine-pill">
            <div className="engine-dot"></div>
            Llama Scout Vision
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="main">

        {/* Engine Toggle */}
        <p className="section-label">Engine Selection</p>
        <div className="toggle-card">
          <div className="toggle-info">
            <span className="toggle-label">Active Engine</span>
            <span className="toggle-active-engine">
              {isHandwritten
                ? <><span>Llama Scout Vision</span> — AI Handwriting</>
                : <><span>Tesseract</span> — Local OCR</>}
            </span>
          </div>
          <div className="toggle-controls">
            <span className={`toggle-option ${!isHandwritten ? 'active' : 'inactive'}`}>Printed</span>
            <button
              type="button"
              className={`toggle-switch ${isHandwritten ? 'on' : ''}`}
              onClick={() => setIsHandwritten(!isHandwritten)}
            >
              <span className={`toggle-thumb ${isHandwritten ? 'on' : ''}`}/>
            </button>
            <span className={`toggle-option ${isHandwritten ? 'active' : 'inactive'}`}>Handwritten</span>
          </div>
        </div>

        {/* Upload */}
        <p className="section-label">Upload Image</p>
        <div className="upload-card">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <div className="upload-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9e9b94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <p className="upload-title"><span>Click to upload</span> or drag & drop</p>
          <p className="upload-sub">PNG, JPG up to 10MB · Auto-compressed for edge</p>
        </div>

        {/* Preview + Action */}
        {imagePath && (
          <>
            <p className="section-label">Preview</p>
            <div className="preview-card">
              <div className="preview-header">
                <span className="preview-header-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Image loaded
                </span>
                <span style={{fontSize:'0.72rem', color:'var(--muted)', fontFamily:'DM Mono, monospace'}}>
                  {isHandwritten ? 'AI Vision' : 'Tesseract'} mode
                </span>
              </div>
              <div className="preview-img-wrap">
                <img src={imagePath} alt="Preview" className="preview-img" />
              </div>
              <div className="preview-footer">
                <button
                  onClick={handleExtractText}
                  disabled={isProcessing}
                  className="extract-btn"
                >
                  {isProcessing ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:'spin 1s linear infinite'}}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      Extracting...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                      </svg>
                      Extract {isHandwritten ? 'Handwriting' : 'Printed Text'}
                    </>
                  )}
                </button>
                {progress && (
                  <div className="progress-wrap">
                    <div className="progress-dot"/>
                    {progress}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Results */}
        {extractedText && (
          <>
            <p className="section-label">Output</p>
            <div className="results-card">
              <div className="results-header">
                <span className="results-title">
                  Extracted Text
                  <span className="results-badge">
                    {isHandwritten ? 'AI VISION' : 'TESSERACT'}
                  </span>
                </span>
                <button
                  onClick={handleCopyText}
                  className={`copy-btn ${isCopied ? 'copied' : ''}`}
                >
                  {isCopied ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Copy Text
                    </>
                  )}
                </button>
              </div>
              <div className="results-body">
                <p className="results-text">{extractedText}</p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-brand-name">OCR<span>AI</span></div>
              <p className="footer-brand-desc">
                Hybrid text extraction.<br/>
                Local engines for printed text,<br/>
                cloud AI for handwriting.
              </p>
            </div>
            <div>
              <p className="footer-col-title">Engines</p>
              <ul className="footer-links">
                <li><a href="https://github.com/naptha/tesseract.js" target="_blank" rel="noopener noreferrer">Tesseract OCR</a></li>
                <li><a href="https://console.groq.com/docs/models" target="_blank" rel="noopener noreferrer">Llama Scout Vision</a></li>
                <li><a href="https://github.com/Arshad4786/OCR#readme" target="_blank" rel="noopener noreferrer">Engine comparison</a></li>
              </ul>
            </div>
            <div>
              <p className="footer-col-title">Project</p>
              <ul className="footer-links">
                <li><a href="https://github.com/Arshad4786/OCR" target="_blank" rel="noopener noreferrer">Documentation</a></li>
                <li><a href="https://console.groq.com/docs/api-reference" target="_blank" rel="noopener noreferrer">API reference</a></li>
                <li><a href="https://github.com/Arshad4786/OCR" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a href="https://github.com/Arshad4786/OCR/commits/main" target="_blank" rel="noopener noreferrer">Changelog</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 OCRAI · v1 MVP · All rights reserved</span>
            <div className="footer-stack">
              <span className="stack-pill">Next.js</span>
              <span className="stack-pill">Tesseract.js</span>
              <span className="stack-pill">Groq</span>
              <span className="stack-pill">Vercel</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}