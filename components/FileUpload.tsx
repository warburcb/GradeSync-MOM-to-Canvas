import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  onFileSelect: (content: string, fileName: string) => void;
  fileName?: string;
  accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  description, 
  onFileSelect,
  fileName,
  accept = ".csv"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          onFileSelect(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 ${fileName ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300'}`}
      onClick={() => inputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept={accept}
        onChange={handleFileChange}
      />
      
      {fileName ? (
        <>
          <div className="bg-emerald-100 p-3 rounded-full mb-3">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-900">{fileName}</h3>
          <p className="text-sm text-emerald-700 mt-1">Ready to process</p>
        </>
      ) : (
        <>
          <div className="bg-slate-100 p-3 rounded-full mb-3">
            <Upload className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-900">{label}</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
          <button className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            Select File
          </button>
        </>
      )}
    </div>
  );
};
