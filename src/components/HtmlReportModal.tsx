// src/components/HtmlReportModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, Printer, ExternalLink, RefreshCw, FileCode2 } from 'lucide-react';

interface HtmlReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportUrl: string;
  downloadUrl: string;
  title: string;
  subtitle?: string;
}

export const HtmlReportModal: React.FC<HtmlReportModalProps> = ({
  isOpen,
  onClose,
  reportUrl,
  downloadUrl,
  title,
  subtitle,
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [isOpen, reportUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.jpg"
              alt="QuinceCA"
              className="w-8 h-8 rounded-lg object-cover shadow border border-slate-700/60 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-100">{title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  HTML Export Ready
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const iframe = document.getElementById('report-iframe') as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.print();
                } else {
                  window.open(reportUrl, '_blank')?.print();
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <a
              href={downloadUrl}
              download
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
              title="Download standalone .html file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .HTML</span>
            </a>

            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center space-x-1"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe Preview Container */}
        <div className="flex-1 bg-slate-100 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xs text-white">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-400 mb-2" />
              <p className="text-xs font-medium text-slate-300">Rendering statutory GST working paper HTML...</p>
            </div>
          )}

          <iframe
            id="report-iframe"
            src={reportUrl}
            onLoad={() => setLoading(false)}
            title="GST Working Paper HTML Report"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
