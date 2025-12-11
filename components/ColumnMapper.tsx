import React, { useState } from 'react';
import { ArrowRight, Trash2, Plus, ArrowDownToLine, Link as LinkIcon, Edit3 } from 'lucide-react';
import { Mapping } from '../types';

interface ColumnMapperProps {
  momHeaders: string[];
  canvasHeaders: string[];
  momPointsMap?: Record<string, string>;
  mappings: Mapping[];
  setMappings: React.Dispatch<React.SetStateAction<Mapping[]>>;
  onNext: () => void;
  onBack: () => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  momHeaders,
  canvasHeaders,
  momPointsMap,
  mappings,
  setMappings,
  onNext,
  onBack
}) => {
  // Filter out columns that are likely student info to keep dropdowns clean
  const studentInfoKeywords = ['name', 'id', 'email', 'sis', 'section'];
  const isAssignmentColumn = (header: string) => 
    !studentInfoKeywords.some(k => header.toLowerCase().includes(k));

  const filteredCanvasHeaders = canvasHeaders.filter(isAssignmentColumn);
  const filteredMomHeaders = momHeaders.filter(isAssignmentColumn);

  // Helper to try and find points
  // 1. Look in the parsed "Max" row from MOM CSV
  // 2. Look in the header string e.g., "Homework 1 (10 pts)"
  const extractPoints = (header: string): string => {
      // Check explicit Max Points row first
      if (momPointsMap && momPointsMap[header]) {
          const val = momPointsMap[header].replace(/[^\d.]/g, '');
          if (val && !isNaN(Number(val))) return val;
      }

      // Fallback to regex on header name
      const match = header.match(/\((\d+)\s*(?:pts|points)?\)/i);
      return match ? match[1] : '10'; // Default to 10 if nothing found
  };

  const handleImportAll = () => {
    // Automatically map ALL assignment columns from MOM.
    // If it exists in Canvas, map to it. If not, create new (map to self).
    const newMappings: Mapping[] = filteredMomHeaders.map(momCol => {
      // Try to find a case-insensitive match
      const existingMatch = filteredCanvasHeaders.find(
        c => c.toLowerCase() === momCol.toLowerCase()
      );
      
      return {
        momColumn: momCol,
        canvasColumn: existingMatch || momCol, // Use existing if found, else use MOM name (implies new)
        points: extractPoints(momCol)
      };
    });
    setMappings(newMappings);
  };

  const addMapping = () => {
    setMappings([...mappings, { momColumn: '', canvasColumn: '', points: '10' }]);
  };

  const updateMapping = (index: number, key: keyof Mapping, value: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [key]: value };
    setMappings(newMappings);
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const isNewAssignment = (colName: string) => {
    return colName && !canvasHeaders.includes(colName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Map Assignments</h2>
          <p className="text-slate-500">Connect MyOpenMath columns to Canvas Gradebook columns.</p>
        </div>
        <div className="flex space-x-2">
           <button
            onClick={handleImportAll}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Import All (Create Missing)</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex text-sm font-semibold text-slate-600">
          <div className="flex-1 pl-2">MyOpenMath Column</div>
          <div className="w-8"></div>
          <div className="flex-[1.5] pl-2">Canvas Target</div>
          <div className="w-10"></div>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {mappings.map((mapping, index) => {
            const isNew = isNewAssignment(mapping.canvasColumn);

            return (
              <div key={index} className="p-4 flex items-center space-x-4 hover:bg-slate-50 transition-colors group">
                {/* Source Column */}
                <div className="flex-1">
                  <select
                    value={mapping.momColumn}
                    onChange={(e) => {
                       const val = e.target.value;
                       const newMappings = [...mappings];
                       newMappings[index].momColumn = val;
                       // Auto-set canvas column if empty to the same name (Create New default)
                       if (!newMappings[index].canvasColumn) {
                           newMappings[index].canvasColumn = val;
                           newMappings[index].points = extractPoints(val);
                       }
                       setMappings(newMappings);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="">Select Column...</option>
                    {filteredMomHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                
                {/* Direction Icon */}
                <div className="text-slate-400">
                  <ArrowRight className="w-5 h-5" />
                </div>

                {/* Target Column */}
                <div className="flex-[1.5] relative">
                  {isNew ? (
                     <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                value={mapping.canvasColumn}
                                onChange={(e) => updateMapping(index, 'canvasColumn', e.target.value)}
                                className="w-full p-2 pl-9 border border-emerald-300 bg-emerald-50 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-emerald-900 placeholder-emerald-400"
                                placeholder="New Assignment Name"
                            />
                            <Edit3 className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                        </div>
                        <div className="w-24 relative" title="Points Possible for new assignment">
                             <input 
                                type="number"
                                value={mapping.points || ''}
                                onChange={(e) => updateMapping(index, 'points', e.target.value)}
                                className="w-full p-2 border border-emerald-300 bg-emerald-50 rounded-md focus:ring-2 focus:ring-emerald-500 text-sm text-center"
                                placeholder="Pts"
                            />
                            <span className="absolute right-1 top-2.5 text-[10px] text-emerald-600 font-bold pointer-events-none">MAX</span>
                        </div>
                         <button 
                            onClick={() => updateMapping(index, 'canvasColumn', '')}
                            className="p-2 text-slate-400 hover:text-indigo-600"
                            title="Switch to Existing List"
                         >
                             <LinkIcon className="w-4 h-4" />
                         </button>
                     </div>
                  ) : (
                      <div className="flex items-center space-x-2">
                        <select
                            value={mapping.canvasColumn}
                            onChange={(e) => {
                                if (e.target.value === '__NEW__') {
                                    // Switch to input mode with current MOM name as default
                                    updateMapping(index, 'canvasColumn', mapping.momColumn);
                                    updateMapping(index, 'points', extractPoints(mapping.momColumn));
                                } else {
                                    updateMapping(index, 'canvasColumn', e.target.value);
                                }
                            }}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="">Select Existing...</option>
                            <optgroup label="Actions">
                                <option value="__NEW__">+ Create as New Assignment</option>
                            </optgroup>
                            <optgroup label="Existing Canvas Assignments">
                                {filteredCanvasHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                                ))}
                            </optgroup>
                        </select>
                      </div>
                  )}
                  {isNew && mapping.canvasColumn && (
                      <span className="absolute -bottom-5 left-0 text-[10px] text-emerald-600 font-medium">
                          * New Assignment (Points: {mapping.points || '?'})
                      </span>
                  )}
                </div>

                <button 
                  onClick={() => removeMapping(index)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {mappings.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic">
              No mappings added yet. Click "Import All" or "Add Mapping".
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={addMapping}
            className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Mapping</span>
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={mappings.length === 0 || mappings.some(m => !m.momColumn || !m.canvasColumn)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
        >
          Preview & Import
        </button>
      </div>
    </div>
  );
};