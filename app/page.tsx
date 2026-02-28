"use client";
import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // The sleek UI Toggle state (false = printed, true = handwritten)
  const [isHandwritten, setIsHandwritten] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePath(URL.createObjectURL(file));
      setExtractedText(""); 
      setIsCopied(false);
    }
  };

  const handleExtractText = async () => {
    if (!imagePath || !imageFile) return;
    setIsProcessing(true);
    setProgress("Starting extraction...");

    if (!isHandwritten) {
      // ----------------------------------------
      // ENGINE 1: TESSERACT (For Printed Text - Runs in Browser)
      // ----------------------------------------
      Tesseract.recognize(imagePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`Processing: ${Math.round(m.progress * 100)}%`);
          }
        }
      }).then(({ data: { text } }) => {
        setExtractedText(text);
        setIsProcessing(false);
        setProgress("");
      }).catch((err) => {
        console.error(err);
        setExtractedText("Error extracting text.");
        setIsProcessing(false);
        setProgress("");
      });

    } else {
      // ----------------------------------------
      // ENGINE 2: NEXT.JS BACKEND (For Handwriting - Secure API)
      // ----------------------------------------
      setProgress("Sending to secure Next.js Backend...");
      try {
        // Send the raw image file to our own API route
        const response = await fetch("/api/ocr", {
          method: "POST",
          body: imageFile, 
        });
        
        const result = await response.json();
        
        if (!response.ok) {
           setExtractedText(result.error || "Backend error occurred.");
        } else if (Array.isArray(result) && result[0]?.generated_text) {
          setExtractedText(result[0].generated_text);
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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Hybrid AI OCR
        </h1>
        <p className="text-center text-gray-500 mb-8">Powered by Tesseract & Microsoft TrOCR</p>

        {/* --- MODERN TOGGLE SWITCH --- */}
        <div className="flex items-center justify-center mb-8 space-x-4 bg-gray-50 py-3 rounded-lg border border-gray-100">
          <span className={`text-sm font-semibold transition-colors ${!isHandwritten ? 'text-blue-600' : 'text-gray-400'}`}>
            Printed Text
          </span>
          
          <button
            type="button"
            onClick={() => setIsHandwritten(!isHandwritten)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isHandwritten ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                isHandwritten ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>

          <span className={`text-sm font-semibold transition-colors ${isHandwritten ? 'text-blue-600' : 'text-gray-400'}`}>
            Handwritten
          </span>
        </div>

        {/* Upload Section */}
        <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 hover:bg-gray-50 transition cursor-pointer relative">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-center pointer-events-none">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>

        {/* Image Preview & Action Button */}
        {imagePath && (
          <div className="flex flex-col items-center mb-8">
            <img src={imagePath} alt="Preview" className="max-h-64 object-contain rounded-md mb-6 shadow-sm border border-gray-200" />
            <button 
              onClick={handleExtractText}
              disabled={isProcessing}
              className={`px-8 py-3 rounded-md text-white font-semibold shadow-md transition-all ${
                isProcessing ? "bg-gray-400 cursor-not-allowed scale-95" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95"
              }`}
            >
              {isProcessing ? "Extracting..." : `Extract ${isHandwritten ? 'Handwritten' : 'Printed'} Text`}
            </button>
            {progress && <p className="text-sm text-blue-600 font-medium mt-3 animate-pulse">{progress}</p>}
          </div>
        )}

        {/* Results Section */}
        {extractedText && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Extracted Text:</h2>
              <button onClick={handleCopyText} className="text-sm bg-white border border-gray-300 px-4 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-700 font-medium flex items-center space-x-2">
                {isCopied ? (
                  <span className="text-green-600">✓ Copied!</span>
                ) : (
                  <span>Copy Text</span>
                )}
              </button>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {extractedText}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}