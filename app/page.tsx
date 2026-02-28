"use client";
import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  // TypeScript now knows imagePath can be a string OR null
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Safely typing the event for React and HTML Inputs
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePath(URL.createObjectURL(file));
      setExtractedText(""); // Reset text on new upload
      setIsCopied(false);
    }
  };

  // Run the OCR engine
  const handleExtractText = () => {
    if (!imagePath) return;
    
    setIsProcessing(true);
    
    Tesseract.recognize(
      imagePath,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`Processing: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    ).then(({ data: { text } }) => {
      setExtractedText(text);
      setIsProcessing(false);
      setProgress("");
    }).catch((err) => {
      console.error(err);
      setExtractedText("Error extracting text. Please try another image.");
      setIsProcessing(false);
      setProgress("");
    });
  };

  // Bonus UX feature: Copy to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Image to Text OCR
        </h1>

        {/* Upload Section */}
        <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 hover:bg-gray-50 transition">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {/* Image Preview & Action Button */}
        {imagePath && (
          <div className="flex flex-col items-center mb-8">
            <img 
              src={imagePath} 
              alt="Uploaded preview" 
              className="max-h-64 object-contain rounded-md mb-4 shadow-sm"
            />
            <button 
              onClick={handleExtractText}
              disabled={isProcessing}
              className={`px-6 py-3 rounded-md text-white font-medium transition ${
                isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isProcessing ? "Extracting..." : "Extract Text"}
            </button>
            {progress && <p className="text-sm text-blue-600 font-medium mt-2">{progress}</p>}
          </div>
        )}

        {/* Results Section */}
        {extractedText && (
          <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Extracted Text:</h2>
              <button 
                onClick={handleCopyText}
                className="text-sm bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition text-gray-600"
              >
                {isCopied ? "Copied!" : "Copy Text"}
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