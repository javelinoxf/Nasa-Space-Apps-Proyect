import { useEffect, useMemo, useState } from 'react';
import { Database, WandSparkles } from 'lucide-react';
import { ANALOGX_DATA, formatAnalogDataValue, type AnalogMeasurement } from '@/features/analog/data/analogData';
import { ANALOG_SITE_TEMPLATES } from '@/features/analog/data/analogSites';
import { PlanetaryDemModel } from './PlanetaryDemModel';
import type { PlanetaryBody } from '@/types/planetary';

interface TerrainAnalogViewerProps {
  body: PlanetaryBody;
  selectedSiteId: string;
  onSelectSite: (siteId: string, body: PlanetaryBody) => void;
}

interface ComparisonMetricRow {
  variable: string;
  label: string;
  unit?: string | null;
  earth?: AnalogMeasurement;
  planet?: AnalogMeasurement;
}

const CATEGORY_ORDER = [
  'Water and ice',
  'Biology',
  'Erosion and hydrology',
  'Human presence',
  'Illumination and operations',
  'Terrain',
  'Subsurface',
  'Thermal',
  'Wind',
  'Additional meteorology',
];

const comparisonsById = new Map(ANALOGX_DATA.comparisons.map((comparison) => [comparison.id, comparison]));
const earthSitesById = new Map(ANALOGX_DATA.earthSites.map((site) => [site.id, site]));
const planetarySitesById = new Map(ANALOGX_DATA.planetarySites.map((site) => [site.id, site]));

function isSafeSourceUrl(sourceUrl: string | null | undefined): sourceUrl is string {
  return Boolean(sourceUrl && /^https:\/\/[^\s]+$/i.test(sourceUrl));
}

function MeasurementCell({ measurement }: { measurement?: AnalogMeasurement }) {
  if (!measurement) {
    return <p className="text-xs italic text-slate-600">No data in the supplied files.</p>;
  }

  const metadata = [
    measurement.status && `Status: ${measurement.status}`,
    measurement.dateStart &&
      `Period: ${measurement.dateStart}${measurement.dateEnd ? ` – ${measurement.dateEnd}` : ''}`,
    measurement.spatialScope && `Coverage: ${measurement.spatialScope}`,
    measurement.method && `Method: ${measurement.method}`,
    measurement.evidence && `Evidence: ${measurement.evidence}`,
    measurement.notes,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="space-y-1">
      <p className="break-words text-xs font-mono text-slate-100">
        {formatAnalogDataValue(measurement.value)}
        {measurement.unit ? <span className="ml-1 text-slate-400">{measurement.unit}</span> : null}
      </p>
      {metadata.length > 0 && (
        <details className="text-[10px] leading-relaxed text-slate-500">
          <summary className="cursor-pointer select-none hover:text-slate-300">Provenance and notes</summary>
          <div className="mt-1 space-y-1 break-words">
            {metadata.map((item, index) => <p key={`${measurement.variable}-${index}`}>{item}</p>)}
            {measurement.sourceId && <p>Source ID: {measurement.sourceId}</p>}
            {isSafeSourceUrl(measurement.sourceUrl) && (
              <a
                href={measurement.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-cyan-400 underline decoration-cyan-800 underline-offset-2 hover:text-cyan-200"
              >
                Open source reference
              </a>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export function TerrainAnalogViewer({
  body,
  selectedSiteId,
  onSelectSite,
}: TerrainAnalogViewerProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'model'>('data');
  const selectedSite =
    ANALOG_SITE_TEMPLATES.find((site) => site.id === selectedSiteId) ??
    ANALOG_SITE_TEMPLATES.find((site) => site.body === body) ??
    ANALOG_SITE_TEMPLATES[0];
  const comparison = comparisonsById.get(selectedSite.id);
  const earthSite = comparison ? earthSitesById.get(comparison.earthSiteId) : undefined;
  const planetarySite = comparison ? planetarySitesById.get(comparison.planetarySiteId) : undefined;

  const metricGroups = useMemo(() => {
    if (!earthSite || !planetarySite) return [];
    const groups = new Map<string, Map<string, ComparisonMetricRow>>();

    const addMeasurement = (measurement: AnalogMeasurement, source: 'earth' | 'planet') => {
      let rows = groups.get(measurement.category);
      if (!rows) {
        rows = new Map();
        groups.set(measurement.category, rows);
      }

      let row = rows.get(measurement.variable);
      if (!row) {
        row = {
          variable: measurement.variable,
          label: measurement.label,
          unit: measurement.unit,
        };
        rows.set(measurement.variable, row);
      }
      if (source === 'earth') row.earth = measurement;
      else row.planet = measurement;
    };

    earthSite.measurements.forEach((measurement) => addMeasurement(measurement, 'earth'));
    planetarySite.measurements.forEach((measurement) => addMeasurement(measurement, 'planet'));

    return Array.from(groups.entries())
      .sort(([left], [right]) => {
        const leftIndex = CATEGORY_ORDER.indexOf(left);
        const rightIndex = CATEGORY_ORDER.indexOf(right);
        return (leftIndex < 0 ? CATEGORY_ORDER.length : leftIndex) -
          (rightIndex < 0 ? CATEGORY_ORDER.length : rightIndex);
      })
      .map(([category, rows]) => ({ category, rows: Array.from(rows.values()) }));
  }, [earthSite, planetarySite]);

  useEffect(() => {
    setActiveTab('data');
  }, [selectedSiteId]);

  if (!comparison || !earthSite || !planetarySite) {
    return (
      <section role="alert" className="m-4 rounded border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200">
        The selected ANALOG-X comparison is missing a source site or data record.
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#07090E] p-4 text-slate-100 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
              <span className="h-px w-5 bg-cyan-500" />
              ANALOG-X · {ANALOGX_DATA.comparisons.length} mission comparisons
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
              Planetary site data and terrain
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Select a source-matrix comparison to inspect the paired Earth and planetary
              measurements, provenance, and scientific limitations.
            </p>
          </div>
        </header>

        <section aria-labelledby="analog-sites-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="analog-sites-heading" className="text-sm font-semibold text-slate-200">
                Ten mission comparisons
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Pairings and mission labels follow the supplied ANALOG-X comparison matrix.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
              {ANALOGX_DATA.earthSites.length} Earth analogs · {ANALOGX_DATA.planetarySites.length} planetary sites
            </span>
          </div>
          <div role="tablist" aria-label="Select analog comparison" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ANALOG_SITE_TEMPLATES.map((site) => {
              const isSelected = site.id === selectedSite.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="analog-site-content"
                  onClick={() => {
                    onSelectSite(site.id, site.body);
                    setActiveTab('data');
                  }}
                  className={`rounded border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-100'
                      : 'border-slate-800 bg-[#0A0E17] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    {site.id} · {site.mission}
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-snug">
                    {site.earthAnalog.name} → {site.region.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section id="analog-site-content" role="tabpanel" className="space-y-4">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {selectedSite.id} · {selectedSite.mission} · {selectedSite.region.name}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Planetary ROI: {selectedSite.region.lat.toFixed(4)}°, {selectedSite.region.lon.toFixed(4)}°
                {' · '}{selectedSite.coordinatesNote}
              </p>
              <p className="mt-1 text-xs text-emerald-300">
                Earth analog: {earthSite.name}, {earthSite.country} · {earthSite.latitudeDeg.toFixed(4)}°,
                {' '}{earthSite.longitudeDeg.toFixed(4)}°
              </p>
            </div>
            <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-300">
              {selectedSite.body.toUpperCase()}
            </span>
          </header>

          <div className="rounded-lg border border-slate-800 bg-[#0A0E17] p-3 text-xs leading-relaxed text-slate-400">
            <p><span className="font-semibold text-slate-200">Analogy:</span> {comparison.analogy}</p>
            <p className="mt-2"><span className="font-semibold text-amber-300">Scientific limits:</span> {comparison.limitations}</p>
          </div>

          <details className="rounded-lg border border-amber-500/20 bg-amber-950/10 px-3 py-2 text-xs text-slate-400">
            <summary className="cursor-pointer select-none font-semibold text-amber-200">
              Data policies and caveats · edition {ANALOGX_DATA.edition}
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>Null values remain missing and are never treated as zero.</li>
              <li>Biology “No” means no positive occurrence in the supplied regional records, not biological absence.</li>
              <li>GHSL population and built-area values are reference-pixel estimates, not site-wide totals.</li>
              <li>{ANALOGX_DATA.policies.guajiraAqua}</li>
              <li>Soil moisture is a modeled 2024 grid mean; precipitation is annualized from an incomplete 363-day interval.</li>
              <li>Earth subsurface measurements were not supplied in this dataset.</li>
            </ul>
          </details>

          <div role="tablist" aria-label="Comparison data and terrain tools" className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            <button type="button" role="tab" aria-selected={activeTab === 'data'} onClick={() => setActiveTab('data')} className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs ${activeTab === 'data' ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/60'}`}>
              <Database className="h-3.5 w-3.5" /> Comparison data
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'model'} onClick={() => setActiveTab('model')} className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs ${activeTab === 'model' ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/60'}`}>
              <WandSparkles className="h-3.5 w-3.5" /> Generate terrain model
            </button>
          </div>

          {activeTab === 'data' && (
            <section aria-label="Paired measurements and provenance" className="space-y-4">
              <p className="text-xs text-slate-400">
                Measurements supplied for {earthSite.name} and {planetarySite.name}. Expand each value for its source, method, and quality notes.
              </p>
              <div className="grid gap-3 xl:grid-cols-2">
                {metricGroups.map(({ category, rows }) => (
                  <article key={category} className="rounded-lg border border-slate-800 bg-[#0A0E17]">
                    <h3 className="border-b border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200">
                      {category}
                    </h3>
                    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-slate-800 px-3 py-2 text-[10px] font-mono text-slate-500">
                      <span>Measurement</span>
                      <span className="text-right">Earth · {earthSite.id}</span>
                      <span className="text-right">{selectedSite.body === 'mars' ? 'Mars' : 'Moon'} · {planetarySite.id}</span>
                    </div>
                    <dl className="divide-y divide-slate-800/70 px-3">
                      {rows.map((row) => (
                        <div key={row.variable} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2 py-2">
                          <dt className="break-words text-xs text-slate-400">
                            {row.label}
                            <span className="mt-0.5 block break-all text-[9px] text-slate-600">{row.variable}</span>
                          </dt>
                          <dd className="min-w-0 text-right"><MeasurementCell measurement={row.earth} /></dd>
                          <dd className="min-w-0 text-right"><MeasurementCell measurement={row.planet} /></dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>

              {earthSite.qualityNotes.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 text-xs text-amber-100/80">
                  <h3 className="mb-1 font-semibold text-amber-200">Earth site quality notes</h3>
                  <ul className="list-disc space-y-1 pl-5">
                    {earthSite.qualityNotes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                </div>
              )}

              <details className="rounded-lg border border-slate-800 bg-[#0A0E17] px-3 py-2">
                <summary className="cursor-pointer select-none text-xs font-semibold text-slate-300">
                  Detailed Earth source records · {earthSite.sourceMeasurements.length} rows
                </summary>
                <div className="mt-3 space-y-2">
                  {earthSite.sourceMeasurements.map((measurement, index) => (
                    <article key={`${measurement.variable}-${index}`} className="grid gap-2 border-t border-slate-800 py-2 text-[10px] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <div>
                        <p className="font-mono text-slate-300">{measurement.label}</p>
                        <p className="mt-0.5 text-slate-500">{measurement.variable}</p>
                        <p className="mt-0.5 text-slate-600">{measurement.sourceFile}</p>
                      </div>
                      <div className="space-y-1 break-words text-slate-400">
                        <p className="font-mono text-slate-200">
                          {formatAnalogDataValue(measurement.value)}
                          {measurement.unit ? ` ${measurement.unit}` : ''}
                        </p>
                        {measurement.status && <p>Status: {measurement.status}</p>}
                        {(measurement.dateStart || measurement.dateEnd) && (
                          <p>Period: {measurement.dateStart ?? 'unknown'} – {measurement.dateEnd ?? 'unknown'}</p>
                        )}
                        {measurement.spatialScope && <p>Spatial scope: {measurement.spatialScope}</p>}
                        {measurement.qualityNotes && <p>{measurement.qualityNotes}</p>}
                        {isSafeSourceUrl(measurement.sourceUrl) && (
                          <a href={measurement.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline underline-offset-2">
                            Open source reference
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </details>

              {earthSite.aquaSummary.length > 0 && (
                <details className="rounded-lg border border-slate-800 bg-[#0A0E17] px-3 py-2">
                  <summary className="cursor-pointer select-none text-xs font-semibold text-slate-300">
                    Guajira Aqua MODIS aggregate records · {earthSite.aquaSummary.length} rows
                  </summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-slate-400">
                    {JSON.stringify(earthSite.aquaSummary, null, 2)}
                  </pre>
                </details>
              )}
            </section>
          )}

          {activeTab === 'model' && (
            <PlanetaryDemModel region={selectedSite.region} earthAnalog={selectedSite.earthAnalog} />
          )}
        </section>
      </div>
    </section>
  );
}
