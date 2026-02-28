# OCR AI: Hybrid Vision Processing Pipeline

🌐 **Live Demo:** [https://ocr-swart-tau.vercel.app/](https://ocr-swart-tau.vercel.app/)

A production-ready Next.js application that intelligently routes Optical Character Recognition (OCR) tasks to optimize for **latency, privacy, and accuracy**.

This MVP implements a hybrid edge/cloud architecture, utilizing local WebAssembly for standard printed text and offloading complex handwritten documents to Meta's state-of-the-art Llama 4 Scout Vision model via Groq's LPU infrastructure.

---

## 🏗 Architecture Overview

This project solves the classic OCR dilemma—balancing speed and cost against the need to read messy human handwriting—by splitting the processing pipeline into two intelligent engines:

### ⚡ Engine 1 — Printed Text (Edge Processing)

* Runs completely **client-side** via `tesseract.js`
* Zero server latency
* Zero API compute cost
* Maximum document privacy
* Ideal for books, PDFs, invoices, and typed documents

### 🧠 Engine 2 — Handwritten Text (Cloud Vision AI)

* Routed securely through a **Next.js API endpoint**
* Uses `meta-llama/llama-4-scout-17b-16e-instruct`
* Hosted on **Groq's LPU infrastructure**
* Optimized for messy handwriting, notes, and scanned forms
* Sub-second inference speeds

---

## ✨ Key Features & Edge-Case Handling

### 📦 Smart Payload Compression

* Uses `browser-image-compression`
* Automatically downsizes high-resolution mobile images
* Targets ~2.5MB (2K resolution)
* Safely stays below Vercel’s 4.5MB Serverless payload limit
* Preserves OCR-critical pixel clarity

### 🛑 Hallucination Prevention

Traditional OCR models sometimes interpret random noise as text (pareidolia).

This system prevents that via:

* Confidence-score thresholding on the edge engine
* Strict system-prompt hardening for the LLM
* Explicit instructions to avoid describing non-text images

### 🛡 API Rate Limiting

* In-memory IP rate limiter
* Prevents abuse and spam
* Protects Groq API quota

### 🎨 Polished User Experience

* Dynamic loading states
* Smooth CSS processing animations
* Glassmorphism-based modern UI
* Perceived-latency optimization during cloud inference

---

## 🛠 Tech Stack

| Category           | Technology                              |
| ------------------ | --------------------------------------- |
| Framework          | Next.js (App Router), React, TypeScript |
| Styling            | Tailwind CSS                            |
| Edge OCR           | Tesseract.js                            |
| Cloud Vision AI    | Groq SDK (Llama 4 Scout Vision)         |
| Image Optimization | Browser-Image-Compression               |
| Deployment         | Vercel                                  |

---

## 🚀 Local Development Setup

### 1️⃣ Clone the Repository

```bash
npm install
```

### 2️⃣ Configure Environment Variables

Create a `.env.local` file in the root directory:

```
GROQ_API_KEY=your_groq_api_key_here
```

### 3️⃣ Start Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🗺 V2 Roadmap

This V1 MVP focuses purely on the core AI routing pipeline and extraction accuracy.

### 🔐 Supabase Integration

* Supabase Auth for user accounts
* Supabase Storage for secure document hosting
* PostgreSQL database for extraction history
* Searchable OCR archive per user

### 📄 Multi-Page PDF Support

* Integrate Mozilla `pdf.js`
* Render each page to hidden `<canvas>`
* Convert to Base64
* Loop through existing vision pipeline

### 🌍 Localization

* Dynamic Tesseract language pack loading
* Multi-language OCR support
* Regional document optimization

---

## 📌 Project Goals

* Combine **edge efficiency** with **cloud intelligence**
* Optimize performance-cost-accuracy tradeoff
* Maintain strong privacy guarantees
* Provide production-grade UX polish

---

## 🧩 Why This Architecture Matters

Most OCR applications force a tradeoff:

* Fast but inaccurate (traditional OCR only)
* Accurate but expensive and slow (LLM-only vision)

This hybrid routing system intelligently selects the optimal engine — delivering both speed and accuracy while minimizing operational cost.

---

## 📄 License

This project is built as an MVP for experimentation, learning, and AI architecture exploration.
