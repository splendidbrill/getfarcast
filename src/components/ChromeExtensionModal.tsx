"use client";

import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/farcast/ljapoonogaahmkkmgbhgielehljmjooa";

export function ChromeExtensionModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const handleDownload = () => {
    window.open(EXTENSION_URL, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#ff6b4e]/20 to-[#ff8c5a]/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ff6b4e]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-[#1a1a2e] mb-3">
            Download our Chrome Extension
          </h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Install the Farcast extension to automatically capture warm leads
            as you browse X, LinkedIn, and Reddit.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] shadow-md hover:shadow-xl hover:shadow-[#ff6b4e]/20 transition-all hover:-translate-y-0.5"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
