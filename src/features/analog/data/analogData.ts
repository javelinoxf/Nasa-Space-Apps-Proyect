import analogXComparisonData from './analogx-comparisons.json';

export type AnalogDataValue = string | number | boolean | string[] | null;

export type AnalogDateValue = string | number | null;

export interface AnalogMeasurement {
  variable: string;
  category: string;
  label: string;
  value: AnalogDataValue;
  unit?: string | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  method?: string | null;
  evidence?: string | null;
  notes?: string | null;
  status?: string | null;
  dateStart?: AnalogDateValue;
  dateEnd?: AnalogDateValue;
  spatialScope?: string | null;
  dataType?: string | null;
}

export interface AnalogEarthSourceMeasurement {
  variable: string;
  label: string;
  value: AnalogDataValue;
  unit: string;
  dateStart: AnalogDateValue;
  dateEnd: AnalogDateValue;
  sourceUrl: string | null;
  sourceFile: string | null;
  spatialScope: string | null;
  status: string | null;
  validObservations: number | null;
  excludedObservations: number | null;
  qualityNotes: string | null;
}

export interface AnalogEarthSite {
  id: string;
  name: string;
  country: string;
  body: string;
  latitudeDeg: number;
  longitudeDeg: number;
  mission: string;
  measurements: AnalogMeasurement[];
  sourceMeasurements: AnalogEarthSourceMeasurement[];
  aquaSummary: Array<Record<string, string>>;
  qualityNotes: string[];
}

export interface AnalogPlanetarySite {
  id: string;
  name: string;
  body: string;
  regionId: string;
  latitudeDeg: number;
  longitudeDeg: number;
  coordinatesNote: string;
  measurements: AnalogMeasurement[];
}

export interface AnalogComparison {
  id: string;
  mission: string;
  earthSiteId: string;
  planetarySiteId: string;
  analogy: string;
  limitations: string;
}

export interface AnalogXDatabase {
  edition: string;
  scope: string;
  policies: {
    units: string;
    biology: string;
    ice: string;
    illumination: string;
    ghslPopulation: string;
    guajiraAqua: string;
  };
  earthSites: AnalogEarthSite[];
  planetarySites: AnalogPlanetarySite[];
  comparisons: AnalogComparison[];
}

export const ANALOGX_DATA: AnalogXDatabase = analogXComparisonData;

export function formatAnalogDataValue(value: AnalogDataValue | undefined): string {
  if (value === null || value === undefined || value === '') return 'No data';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'No items';
  return String(value);
}
