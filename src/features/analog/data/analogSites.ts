import { REGION_PRESETS } from '@/data/planetaryCatalog';
import { ANALOGX_DATA } from '@/features/analog/data/analogData';
import type { PlanetaryBody, RegionPreset } from '@/types/planetary';

export interface AnalogSiteTemplate {
  id: string;
  mission: string;
  body: PlanetaryBody;
  region: RegionPreset;
  analogy: string;
  limitations: string;
  coordinatesNote: string;
  earthAnalog: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    description: string;
  };
}

const regionById = new Map(REGION_PRESETS.map((region) => [region.id, region]));
const earthSiteById = new Map(ANALOGX_DATA.earthSites.map((site) => [site.id, site]));
const planetarySiteById = new Map(ANALOGX_DATA.planetarySites.map((site) => [site.id, site]));

export const ANALOG_SITE_TEMPLATES: AnalogSiteTemplate[] = ANALOGX_DATA.comparisons.map(
  (comparison) => {
    const earthSite = earthSiteById.get(comparison.earthSiteId);
    const planetarySite = planetarySiteById.get(comparison.planetarySiteId);
    if (!earthSite || !planetarySite) {
      throw new Error(`Unknown source site in ANALOG-X comparison ${comparison.id}.`);
    }

    if (planetarySite.body !== 'mars' && planetarySite.body !== 'moon') {
      throw new Error(`Unknown planetary body in ANALOG-X site ${planetarySite.id}.`);
    }

    const baseRegion = regionById.get(planetarySite.regionId);
    if (!baseRegion || baseRegion.body !== planetarySite.body) {
      throw new Error(`Unknown or mismatched planetary region in ANALOG-X site ${planetarySite.id}.`);
    }

    return {
      id: comparison.id,
      mission: comparison.mission,
      body: planetarySite.body,
      region: {
        ...baseRegion,
        lat: planetarySite.latitudeDeg,
        lon: planetarySite.longitudeDeg,
        subtitle: 'ANALOG-X region of interest · supplied workbook coordinates',
      },
      analogy: comparison.analogy,
      limitations: comparison.limitations,
      coordinatesNote: planetarySite.coordinatesNote,
      earthAnalog: {
        id: earthSite.id,
        name: `${earthSite.name}, ${earthSite.country}`,
        lat: earthSite.latitudeDeg,
        lon: earthSite.longitudeDeg,
        description: comparison.analogy,
      },
    };
  }
);

export function getAnalogSiteTemplates(body: PlanetaryBody): AnalogSiteTemplate[] {
  return ANALOG_SITE_TEMPLATES.filter((site) => site.body === body);
}
