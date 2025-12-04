
import React, { useEffect, useMemo, useState } from 'react';
import { Download, AlertCircle, CheckCircle2, BarChart3, RefreshCw, PlusCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CsvData, Mapping, GradeStats } from '../types';
import { generateCanvasCsv } from '../services/csvService';
import { analyzeGradeData } from '../services/geminiService';

interface DashboardProps {
  momData: CsvData;
  canvasData: CsvData;
  mappings: Mapping[];
  onBack: () => void;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  momData,
  canvasData,
  mappings,
  onBack,
  onReset
}) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Compute the final list of headers (Original Canvas + New Assignments)
  const finalHeaders = useMemo(() => {
      const newCols = mappings
        .map(m => m.canvasColumn)
        .filter(c => !canvasData.headers.includes(c));
      // Remove duplicates
      const uniqueNewCols = Array.from(new Set(newCols));
      return [...canvasData.headers, ...uniqueNewCols];
  }, [canvasData.headers, mappings]);

  // Merge points logic
  const pointsMap = useMemo(() => {
    const map: Record<string, string> = { ...canvasData.pointsPossibleRow };
    
    // Add points for new assignments
    mappings.forEach(m => {
        if (!canvasData.headers.includes(m.canvasColumn) && m.points) {
            map[m.canvasColumn] = m.points;
        }
    });

    // Ensure identifying columns (Student, ID, etc.) have 'Points Possible' text in first col if needed
    // Typically Canvas wants "Points Possible" in the first cell of that row
    const firstHeader = finalHeaders[0];
    if (firstHeader && !map[firstHeader]) {
        map[firstHeader] = "Points Possible";
    }

    return map;
  }, [canvasData.pointsPossibleRow, canvasData.headers, mappings, finalHeaders]);

  // Core logic to merge data
  const mergedData = useMemo(() => {
    // 1. Identify key columns for matching (Student ID or Name)
    const canvasIdCol = canvasData.headers.find(h => h.includes("SIS User ID") || h === "ID");
    const momIdCol = momData.headers.find(h => h === "ID" || h.includes("Student ID"));
    
    const canvasNameCol = canvasData.headers.find(h => h.includes("Student"));
    const momNameCol = momData.headers.find(h => h.includes("Name") || h.includes("Student"));

    const matches = canvasData.rows.map(canvasRow => {
      let momRow = undefined;

      // Try ID Match
      if (canvasIdCol && momIdCol) {
        momRow = momData.rows.find(m => m[momIdCol] === canvasRow[canvasIdCol]);
      }

      // Fallback to Name Match
      if (!momRow && canvasNameCol && momNameCol) {
        momRow = momData.rows.find(m => {
            const cName = canvasRow[canvasNameCol].toLowerCase().replace(/['"]/g, '').trim();
            const mName = m[momNameCol].toLowerCase().replace(/['"]/g, '').trim();
            return cName === mName;
        });
      }

      // Create a copy of canvas row to modify
      const newRow: Record<string, string> = { ...canvasRow };
      
      // Initialize new columns with empty strings (important for new assignments)
      finalHeaders.forEach(h => {
          if (!(h in newRow)) newRow[h] = '';
      });
      
      if (momRow) {
        mappings.forEach(map => {
            if (map.momColumn && map.canvasColumn && momRow) {
                newRow[map.canvasColumn] = momRow[map.momColumn];
            }
        });
      }

      return {
        original: canvasRow,
        merged: newRow,
        matched: !!momRow
      };
    });

    return matches;
  }, [momData, canvasData, mappings, finalHeaders]);

  const stats = useMemo(() => {
    if (mappings.length === 0) return null;
    const targetCol = mappings[0].canvasColumn;
    
    const grades = mergedData
      .filter(d => d.matched)
      .map(d => parseFloat(d.merged[targetCol]))
      .filter(n => !isNaN(n));

    if (grades.length === 0) return null;

    const min = Math.min(...grades);
    const max = Math.max(...grades);
    const sum = grades.reduce((a, b) => a + b, 0);
    const avg = sum / grades.length;
    const sorted = [...grades].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const buckets = [0, 60, 70, 80, 90, 100];
    const distribution = buckets.slice(0, -1).map((b, i) => {
        const next = buckets[i + 1];
        const count = grades.filter(g => g >= b && (i === buckets.length - 2 ? g <= next : g < next)).length;
        return { range: `${b}-${next}`, count };
    });
    const over100 = grades.filter(g => g > 100).length;
    if(over100 > 0) distribution.push({ range: '>100', count: over100 });

    return { average: avg, median, min, max, distribution };
  }, [mergedData, mappings]);

  useEffect(() => {
    if (stats && !analysis) {
        setLoadingAnalysis(true);
        const statsSummary = `Average: ${stats.average.toFixed(2)}, Median: ${stats.median}, Min: ${stats.min}, Max: ${stats.max}. Distribution: ${JSON.stringify(stats.distribution)}`;
        analyzeGradeData(statsSummary).then(res => {
            setAnalysis(res);
            setLoadingAnalysis(false);
        });
    }
  }, [stats]);

  const handleDownload = () => {
    const csvContent = generateCanvasCsv(
        finalHeaders, 
        mergedData.map(m => m.merged),
        pointsMap
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "canvas_import_ready.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const matchedCount = mergedData.filter(d => d.matched).length;
  const totalCount = mergedData.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold">Match Rate</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {matchedCount} <span className="text-lg text-slate-400 font-normal">/ {totalCount}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Students matched by ID/Name</p>
        </div>

        {stats && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center space-x-3 text-indigo-600 mb-2">
                <BarChart3 className="w-5 h-5" />
                <h3 className="font-semibold">Class Average</h3>
             </div>
             <div className="text-3xl font-bold text-slate-900">
                {stats.average.toFixed(1)}%
             </div>
             <p className="text-sm text-slate-500 mt-1">Based on first mapped assignment</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
            <h3 className="font-semibold text-slate-800 mb-2">AI Insight</h3>
            {loadingAnalysis ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                </div>
            ) : (
                <p className="text-sm text-slate-600 leading-relaxed">
                    {analysis || "No sufficient data for analysis."}
                </p>
            )}
        </div>
      </div>

      {/* Chart Section */}
      {stats && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Grade Distribution Preview</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.distribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" tick={{fill: '#64748b'}} />
                        <YAxis tick={{fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Preview Data (First 5 Rows)</h3>
            <div className="flex space-x-2">
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium flex items-center"><PlusCircle className="w-3 h-3 mr-1"/> New Assignment</span>
                <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded font-medium">Updated</span>
                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">Read-only</span>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                        <th className="p-3 border-b">Status</th>
                        {/* Show first few regular cols + ALL new mapped columns */}
                        {finalHeaders.slice(0, 4).map(h => (
                            <th key={h} className="p-3 border-b whitespace-nowrap">{h}</th>
                        ))}
                         {/* Show New Columns that are further down the list if they aren't in first 4 */}
                        {mappings.filter(m => !canvasData.headers.includes(m.canvasColumn)).map(m => (
                            <th key={m.canvasColumn} className="p-3 border-b whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-200">
                                <div className="flex items-center space-x-1">
                                    <PlusCircle className="w-3 h-3" />
                                    <span>{m.canvasColumn}</span>
                                    <span className="text-[10px] ml-1 opacity-70">({m.points} pts)</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {mergedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className={!row.matched ? 'bg-red-50' : 'hover:bg-slate-50'}>
                            <td className="p-3">
                                {row.matched ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                )}
                            </td>
                            {/* Standard Columns */}
                            {finalHeaders.slice(0, 4).map(h => {
                                const isMapped = mappings.some(m => m.canvasColumn === h);
                                return (
                                    <td key={h} className={`p-3 whitespace-nowrap ${isMapped ? 'font-semibold text-indigo-600 bg-indigo-50/30' : 'text-slate-600'}`}>
                                        {row.merged[h]}
                                    </td>
                                );
                            })}
                            {/* New Columns */}
                            {mappings.filter(m => !canvasData.headers.includes(m.canvasColumn)).map(m => (
                                <td key={m.canvasColumn} className="p-3 whitespace-nowrap font-bold text-emerald-600 bg-emerald-50/30">
                                    {row.merged[m.canvasColumn]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-2 text-center text-xs text-slate-400 border-t border-slate-100">
            Showing partial preview of columns for readability
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
        >
          Adjust Mapping
        </button>
        <div className="flex space-x-3">
             <button
                onClick={onReset}
                className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium flex items-center space-x-2"
            >
                <RefreshCw className="w-4 h-4" />
                <span>Start Over</span>
            </button>
            <button
            onClick={handleDownload}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-md shadow-emerald-200 flex items-center space-x-2"
            >
            <Download className="w-4 h-4" />
            <span>Download Import CSV</span>
            </button>
        </div>
      </div>
    </div>
  );
};
