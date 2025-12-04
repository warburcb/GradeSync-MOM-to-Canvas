
export interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
  pointsPossibleRow?: Record<string, string>;
}

export interface Mapping {
  momColumn: string;
  canvasColumn: string;
  points?: string;
}

export interface StudentMatch {
  canvasStudent: Record<string, string>;
  momStudent: Record<string, string> | undefined;
  matched: boolean;
}

export interface GradeStats {
  average: number;
  median: number;
  min: number;
  max: number;
  distribution: { range: string; count: number }[];
}

export enum AppState {
  UPLOAD,
  MAPPING,
  REVIEW,
  EXPORT
}
