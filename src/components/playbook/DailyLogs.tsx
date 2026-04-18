"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImagePlus,
  Trash2,
  Save,
  BookOpen,
} from "lucide-react";

interface DailyLog {
  date: string;
  content: string;
  imageDataUrl?: string;
  updatedAt: string;
}

type LogsMap = Record<string, DailyLog>;

const STORAGE_KEY = "farcast_daily_logs";

function loadLogs(): LogsMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLogs(logs: LogsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Modal ──────────────────────────────────────────────────────────────────

function LogModal({
  dateKey,
  log,
  onClose,
  onSave,
  onDelete,
}: {
  dateKey: string;
  log: DailyLog | undefined;
  onClose: () => void;
  onSave: (dateKey: string, content: string, imageDataUrl?: string) => void;
  onDelete: (dateKey: string) => void;
}) {
  const [content, setContent] = useState(log?.content || "");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(log?.imageDataUrl);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaving(true);
    onSave(dateKey, content, imageDataUrl);
    setTimeout(() => { setSaving(false); onClose(); }, 300);
  };

  const handleDelete = () => {
    onDelete(dateKey);
    onClose();
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5 shrink-0">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Growth Log</p>
            <h3 className="text-base font-bold text-[#1a1a2e]">{formatDisplayDate(dateKey)}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you do today to grow? Channels tried, conversations had, things that worked, things that didn't..."
            className="w-full h-40 resize-none text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-[#ff6b4e]/50 focus:ring-2 focus:ring-[#ff6b4e]/10 leading-relaxed"
          />

          {/* Image section */}
          {imageDataUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt="Log attachment" className="w-full max-h-48 object-cover" />
              <button
                onClick={() => setImageDataUrl(undefined)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 justify-center py-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#ff6b4e]/40 text-sm text-gray-400 hover:text-[#ff6b4e] transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              Attach a photo or screenshot
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 shrink-0">
          {log ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSave}
            disabled={!content.trim() && !imageDataUrl}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────────────────────

export function DailyLogs() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [logs, setLogs] = useState<LogsMap>({});
  const [openDate, setOpenDate] = useState<string | null>(null);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleSave = (dateKey: string, content: string, imageDataUrl?: string) => {
    const updated = {
      ...logs,
      [dateKey]: { date: dateKey, content, imageDataUrl, updatedAt: new Date().toISOString() },
    };
    setLogs(updated);
    saveLogs(updated);
  };

  const handleDelete = (dateKey: string) => {
    const updated = { ...logs };
    delete updated[dateKey];
    setLogs(updated);
    saveLogs(updated);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const logCount = Object.keys(logs).length;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Daily Growth Log</h2>
          <p className="text-sm text-gray-500">
            Journal your daily growth activities. In future, these logs will help generate authentic Reddit and X posts.
          </p>
        </div>
        {logCount > 0 && (
          <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[#ff6b4e]/10 text-[#ff6b4e] border border-[#ff6b4e]/20">
            {logCount} {logCount === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-3xl border border-black/5 overflow-hidden bg-gray-50/50">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-black/5">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h3 className="text-sm font-bold text-[#1a1a2e]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-black/5">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-bold text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-12 sm:h-14 border-b border-r border-black/[0.04] last:border-r-0" />;
            }
            const dateKey = formatDateKey(viewYear, viewMonth, day);
            const hasLog = !!logs[dateKey];
            const isToday = dateKey === todayKey;
            const isFuture = dateKey > todayKey;
            const colIdx = idx % 7;

            return (
              <button
                key={dateKey}
                onClick={() => !isFuture && setOpenDate(dateKey)}
                disabled={isFuture}
                className={`relative h-12 sm:h-14 flex flex-col items-center justify-center border-b border-r border-black/[0.04] last:border-r-0 transition-all group
                  ${isFuture
                    ? "cursor-default opacity-30"
                    : "hover:bg-white hover:shadow-sm cursor-pointer"
                  }
                  ${colIdx === 6 ? "border-r-0" : ""}
                `}
              >
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors
                    ${isToday
                      ? "bg-[#ff6b4e] text-white font-bold"
                      : hasLog
                      ? "text-[#1a1a2e] font-bold"
                      : "text-gray-500 group-hover:text-[#1a1a2e]"
                    }`}
                >
                  {day}
                </span>
                {hasLog && !isToday && (
                  <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#ff6b4e]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent logs preview */}
      {logCount > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Entries</p>
          <div className="space-y-2">
            {Object.values(logs)
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((log) => (
                <button
                  key={log.date}
                  onClick={() => setOpenDate(log.date)}
                  className="w-full flex items-start gap-3 p-4 rounded-2xl border border-black/5 bg-white hover:border-[#ff6b4e]/20 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#ff6b4e]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-[#ff6b4e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 mb-0.5">{formatDisplayDate(log.date)}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{log.content}</p>
                  </div>
                  {log.imageDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={log.imageDataUrl}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-black/5"
                    />
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {openDate && (
        <LogModal
          dateKey={openDate}
          log={logs[openDate]}
          onClose={() => setOpenDate(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
