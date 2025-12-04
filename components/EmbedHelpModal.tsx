import React from 'react';
import { X, Copy, ExternalLink, Code } from 'lucide-react';

interface EmbedHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedHelpModal: React.FC<EmbedHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here if you had a toast system
  };

  const iframeCode = `<iframe 
  src="https://your-app-url.com" 
  style="width: 100%; height: 800px; border: none;" 
  allow="clipboard-write"
></iframe>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">How to Embed in Canvas</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Prerequisite: Host the App</p>
            <p>
              Before embedding, you must host this application on a static hosting service like 
              <span className="font-semibold"> Vercel</span>, 
              <span className="font-semibold"> Netlify</span>, or 
              <span className="font-semibold"> GitHub Pages</span>.
            </p>
          </div>

          {/* Method 1 */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">1</div>
              <h3 className="text-lg font-semibold text-slate-900">Option A: Add to Module (Recommended)</h3>
            </div>
            <p className="text-slate-600 mb-4 ml-10">
              The easiest way to add this tool to your course. It gives the app the most screen space.
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-10 text-slate-700 text-sm">
              <li>Go to your Canvas Course <strong>Modules</strong>.</li>
              <li>Click the <strong>+</strong> button on a module.</li>
              <li>Select <strong>External URL</strong> from the dropdown.</li>
              <li>Paste your hosted App URL.</li>
              <li>Check <strong>Load in a new tab</strong> (optional, but recommended for small screens).</li>
            </ol>
          </div>

          <hr className="border-slate-100" />

          {/* Method 2 */}
          <div>
             <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">2</div>
              <h3 className="text-lg font-semibold text-slate-900">Option B: Embed in a Page</h3>
            </div>
            <p className="text-slate-600 mb-4 ml-10">
              Use this if you want the tool to appear inside a specific Page alongside other instructions.
            </p>
            
            <div className="ml-10">
              <div className="bg-slate-900 rounded-lg p-4 relative group">
                <code className="text-emerald-400 font-mono text-xs break-all block pr-10">
                  {iframeCode}
                </code>
                <button 
                  onClick={() => copyToClipboard(iframeCode)}
                  className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                  title="Copy Code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Create a new Page &rarr; Switch to <strong>HTML Editor</strong> (the &lt;/&gt; icon) &rarr; Paste the code above.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};