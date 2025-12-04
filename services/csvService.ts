
import { CsvData } from '../types';

export const parseCsv = (content: string): CsvData => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  // Helper to split CSV line considering quotes
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
  };

  const headers = splitLine(lines[0]);
  
  let dataStartIndex = 1;
  let pointsPossibleRow: Record<string, string> | undefined = undefined;

  // Check if second row is "Points Possible" (Canvas) or "Max" (MyOpenMath)
  if (lines.length > 1) {
      const secondLineVals = splitLine(lines[1]);
      
      // Check first column for MOM "Max" or "Max Points"
      const firstCol = secondLineVals[0]?.trim().toLowerCase();
      const isMomMaxRow = firstCol === 'max' || firstCol === 'max points' || firstCol.includes('max');
      
      // Check for Canvas "Points Possible" anywhere in the row (usually col 2 or 3)
      const isCanvasPointsRow = secondLineVals.some(val => val.trim() === 'Points Possible');

      if (isMomMaxRow || isCanvasPointsRow) {
          pointsPossibleRow = {};
          headers.forEach((h, i) => {
              // Store raw value; clean it up when using it if necessary
              pointsPossibleRow![h] = secondLineVals[i] || '';
          });
          dataStartIndex = 2; // Skip this row for student data
      }
  }

  const rows = lines.slice(dataStartIndex).map(line => {
    const values = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return { headers, rows, pointsPossibleRow };
};

export const generateCanvasCsv = (
  headers: string[],
  matchedData: Record<string, string>[],
  pointsMap: Record<string, string>
): string => {
  // Helper to escape values for CSV
  const escapeCsvVal = (val: string) => {
      if (val === undefined || val === null) return '';
      const stringVal = String(val);
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
  };

  const headerRow = headers.map(escapeCsvVal).join(',');
  
  // Create the "Points Possible" row required by Canvas
  // If we don't have a value for a column, leave it empty (Canvas will ignore or keep existing)
  const pointsRow = headers.map(header => {
      return escapeCsvVal(pointsMap[header] || '');
  }).join(',');

  const dataRows = matchedData.map(row => {
    return headers.map(header => {
      return escapeCsvVal(row[header] || '');
    }).join(',');
  });

  return [headerRow, pointsRow, ...dataRows].join('\n');
};