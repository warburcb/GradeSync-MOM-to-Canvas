import React, { useState } from 'react';
import { Layout, FileSpreadsheet, ArrowRight, HelpCircle } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ColumnMapper } from './components/ColumnMapper';
import { Dashboard } from './components/Dashboard';
import { EmbedHelpModal } from './components/EmbedHelpModal';
import { parseCsv } from './services/csvService';
import { CsvData, Mapping, AppState } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppState>(AppState.UPLOAD);
  
  // Data State
  const [momData, setMomData] = useState<CsvData | null>(null);
  const [canvasData, setCanvasData] = useState<CsvData | null>(null);
  
  // File Name State for UI
  const [momFileName, setMomFileName] = useState<string>("");
  const [canvasFileName, setCanvasFileName] = useState<string>("");
  
  // Mapping State
  const [mappings, setMappings] = useState<Mapping[]>([]);

  // UI State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleMomUpload = (content: string, name: string) => {
    setMomData(parseCsv(content));
    setMomFileName(name);
  };

  const handleCanvasUpload = (content: string, name: string) => {
    setCanvasData(parseCsv(content));
    setCanvasFileName(name);
  };

  const canProceedToMapping = momData && canvasData && momData.headers.length > 0 && canvasData.headers.length > 0;

  const resetApp = () => {
    setMomData(null);
    setCanvasData(null);
    setMomFileName("");
    setCanvasFileName("");
    setMappings([]);
    setStep(AppState.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      <EmbedHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
              GradeSync
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
              <span className={step === AppState.UPLOAD ? "text-indigo-600 font-semibold" : ""}>Upload</span>
              <ArrowRight className="w-4 h-4" />
              <span className={step === AppState.MAPPING ? "text-indigo-600 font-semibold" : ""}>Map</span>
              <ArrowRight className="w-4 h-4" />
              <span className={step === AppState.REVIEW ? "text-indigo-600 font-semibold" : ""}>Review</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center space-x-1 text-slate-500 hover:text-indigo-600 transition-colors"
              title="How to Embed in Canvas"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Embed in Canvas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {step === AppState.UPLOAD && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-bold text-slate-900">Import Grades with Confidence</h2>
              <p className="text-slate-500 text-lg">
                Seamlessly transfer grades from MyOpenMath to Canvas without the spreadsheet headaches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                label="MyOpenMath Export"
                description="Upload the .csv file exported from your MyOpenMath gradebook."
                onFileSelect={handleMomUpload}
                fileName={momFileName}
              />
              <FileUpload
                label="Canvas Export"
                description="Upload the .csv file exported from your Canvas gradebook."
                onFileSelect={handleCanvasUpload}
                fileName={canvasFileName}
              />
            </div>

            <div className="flex justify-center pt-8">
              <button
                disabled={!canProceedToMapping}
                onClick={() => setStep(AppState.MAPPING)}
                className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <span>Continue to Mapping</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start space-x-4 mt-12">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Why do I need the Canvas Export?</p>
                <p>Canvas requires specific internal Student IDs (e.g., SIS ID) to map grades accurately. We use the Canvas export as a template to ensure the final file imports perfectly every time.</p>
              </div>
            </div>
          </div>
        )}

        {step === AppState.MAPPING && momData && canvasData && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <ColumnMapper
              momHeaders={momData.headers}
              canvasHeaders={canvasData.headers}
              momPointsMap={momData.pointsPossibleRow}
              mappings={mappings}
              setMappings={setMappings}
              onNext={() => setStep(AppState.REVIEW)}
              onBack={() => setStep(AppState.UPLOAD)}
            />
          </div>
        )}

        {step === AppState.REVIEW && momData && canvasData && (
          <Dashboard
            momData={momData}
            canvasData={canvasData}
            mappings={mappings}
            onBack={() => setStep(AppState.MAPPING)}
            onReset={resetApp}
          />
        )}
      </main>
    </div>
  );
};

export default App;