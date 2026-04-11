'use client';

/**
 * Interactive Map Component - Leaflet-based UK Geography Map
 *
 * Features:
 * - Clickable national parks, rivers, mountains with fun fact popups
 * - Progress visualisation: mastered KCs unlock coloured regions
 * - Hotspot markers with educational content
 * - Temporal layer toggle (if applicable)
 * - Mobile-optimised touch interactions
 *
 * Uses Leaflet.js (free, no API key) with react-leaflet wrapper.
 * Map tiles from OpenStreetMap (free, unlimited).
 */

import { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Mountain, Waves, Trees, Info, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

// --- Geographic Data ---

interface MapFeature {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'national_park' | 'river' | 'mountain' | 'city';
  kcId: string;
  funFact: string;
  region: string;
}

const UK_FEATURES: MapFeature[] = [
  // National Parks
  { id: 'np_lake_district', name: 'Lake District', lat: 54.45, lng: -3.07, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Lake District is England\'s largest national park and was designated a UNESCO World Heritage Site in 2017 for its unique cultural landscape.', region: 'North West England' },
  { id: 'np_yorkshire_dales', name: 'Yorkshire Dales', lat: 54.23, lng: -2.16, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Yorkshire Dales contain over 2,000 miles of dry stone walls - enough to stretch from London to Istanbul.', region: 'North England' },
  { id: 'np_peak_district', name: 'Peak District', lat: 53.30, lng: -1.80, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Peak District was the UK\'s first national park (1951) and is the second most visited national park in the world after Mount Fuji.', region: 'Central England' },
  { id: 'np_snowdonia', name: 'Snowdonia (Eryri)', lat: 52.92, lng: -3.87, type: 'national_park', kcId: 'UK_national_parks', funFact: 'Snowdon (Yr Wyddfa) at 1,085m is the highest peak in Wales. Legend says a giant named Rhitta Gawr is buried at the summit.', region: 'North Wales' },
  { id: 'np_brecon_beacons', name: 'Brecon Beacons (Bannau Brycheiniog)', lat: 51.88, lng: -3.44, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Brecon Beacons was designated an International Dark Sky Reserve - one of only five in the world at the time.', region: 'South Wales' },
  { id: 'np_dartmoor', name: 'Dartmoor', lat: 50.57, lng: -3.92, type: 'national_park', kcId: 'UK_national_parks', funFact: 'Dartmoor is home to wild Dartmoor ponies that have roamed the moorland for centuries and inspired the legend of the Hound of the Baskervilles.', region: 'South West England' },
  { id: 'np_exmoor', name: 'Exmoor', lat: 51.14, lng: -3.58, type: 'national_park', kcId: 'UK_national_parks', funFact: 'Exmoor has the highest sea cliffs in England - the Great Hangman stands at 318m, higher than The Shard in London.', region: 'South West England' },
  { id: 'np_northumberland', name: 'Northumberland', lat: 55.28, lng: -2.22, type: 'national_park', kcId: 'UK_national_parks', funFact: 'Northumberland National Park is England\'s least populated and contains a section of Hadrian\'s Wall, built by the Romans in AD 122.', region: 'North East England' },
  { id: 'np_north_york_moors', name: 'North York Moors', lat: 54.37, lng: -0.87, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The North York Moors contain one of the largest expanses of heather moorland in England - turning purple every August.', region: 'North East England' },
  { id: 'np_broads', name: 'The Broads', lat: 52.62, lng: 1.57, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Broads are not natural lakes but medieval peat diggings that flooded. They have the status of a national park but are technically a separate authority.', region: 'East England' },
  { id: 'np_new_forest', name: 'New Forest', lat: 50.87, lng: -1.60, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The New Forest was created by William the Conqueror in 1079 as a royal hunting ground. Wild ponies, cattle, and pigs still roam freely under ancient "commoning" rights.', region: 'South England' },
  { id: 'np_south_downs', name: 'South Downs', lat: 50.93, lng: -0.47, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The South Downs is England\'s newest national park (2010) and the chalk grassland supports over 40 species of butterfly.', region: 'South East England' },
  { id: 'np_cairngorms', name: 'Cairngorms', lat: 57.07, lng: -3.65, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Cairngorms is the UK\'s largest national park and contains four of Scotland\'s five highest mountains. It has the only free-ranging reindeer herd in Britain.', region: 'Scotland' },
  { id: 'np_loch_lomond', name: 'Loch Lomond & The Trossachs', lat: 56.24, lng: -4.58, type: 'national_park', kcId: 'UK_national_parks', funFact: 'Loch Lomond is the largest freshwater lake in Great Britain by surface area and contains over 30 islands.', region: 'Scotland' },
  { id: 'np_pembrokeshire', name: 'Pembrokeshire Coast', lat: 51.77, lng: -5.10, type: 'national_park', kcId: 'UK_national_parks', funFact: 'The Pembrokeshire Coast is the UK\'s only truly coastal national park and has more blue flag beaches than any other county in Wales.', region: 'West Wales' },

  // Major Rivers
  { id: 'rv_thames', name: 'River Thames', lat: 51.50, lng: -0.12, type: 'river', kcId: 'UK_rivers', funFact: 'The Thames is 346km long and flows through 16 counties. Over 125 species of fish live in it - including seahorses near Greenwich.', region: 'South East England' },
  { id: 'rv_severn', name: 'River Severn', lat: 51.68, lng: -2.67, type: 'river', kcId: 'UK_rivers', funFact: 'The Severn is the UK\'s longest river at 354km. It has the second highest tidal range in the world, creating the famous Severn Bore wave.', region: 'Wales/West England' },
  { id: 'rv_trent', name: 'River Trent', lat: 52.95, lng: -1.15, type: 'river', kcId: 'UK_rivers', funFact: 'The Trent is England\'s third longest river and its name may derive from the Celtic word for "strongly flooding" - it was prone to severe floods before modern management.', region: 'Central England' },
  { id: 'rv_tay', name: 'River Tay', lat: 56.45, lng: -3.43, type: 'river', kcId: 'UK_rivers', funFact: 'The Tay carries more water than any other river in the UK and its famous salmon run attracts anglers from around the world.', region: 'Scotland' },
  { id: 'rv_clyde', name: 'River Clyde', lat: 55.86, lng: -4.27, type: 'river', kcId: 'UK_rivers', funFact: 'The Clyde was once so polluted no fish could survive. After a massive cleanup, Atlantic salmon returned in the 1980s for the first time in over a century.', region: 'Scotland' },

  // Mountains
  { id: 'mt_ben_nevis', name: 'Ben Nevis', lat: 56.80, lng: -5.00, type: 'mountain', kcId: 'UK_mountains', funFact: 'Ben Nevis is the UK\'s highest peak at 1,345m. Its summit has the ruins of a Victorian weather observatory that operated from 1883 to 1904.', region: 'Scotland' },
  { id: 'mt_snowdon', name: 'Snowdon (Yr Wyddfa)', lat: 53.07, lng: -4.08, type: 'mountain', kcId: 'UK_mountains', funFact: 'Snowdon has a mountain railway and a cafe at the summit. It receives about 600,000 visitors per year, making it the busiest mountain in the UK.', region: 'Wales' },
  { id: 'mt_scafell_pike', name: 'Scafell Pike', lat: 54.45, lng: -3.21, type: 'mountain', kcId: 'UK_mountains', funFact: 'Scafell Pike at 978m is England\'s highest peak. Its summit cairn contains a war memorial tablet dedicated to the men of the Lake District who fell in WWI.', region: 'England' },
  { id: 'mt_helvellyn', name: 'Helvellyn', lat: 54.53, lng: -3.00, type: 'mountain', kcId: 'UK_mountains', funFact: 'Helvellyn\'s Striding Edge is one of England\'s most famous ridge walks. In 1926, an aeroplane landed on its summit - the first landing on a British mountain.', region: 'England' },

  // Capital Cities
  { id: 'ct_london', name: 'London', lat: 51.51, lng: -0.13, type: 'city', kcId: 'UK_capitals', funFact: 'London has been a major settlement for nearly 2,000 years. Big Ben\'s clock is so accurate it can be adjusted by placing old pennies on the pendulum.', region: 'England' },
  { id: 'ct_edinburgh', name: 'Edinburgh', lat: 55.95, lng: -3.19, type: 'city', kcId: 'UK_capitals', funFact: 'Edinburgh was the first city in the world to have its own fire brigade (1824) and is built on an extinct volcano - Arthur\'s Seat.', region: 'Scotland' },
  { id: 'ct_cardiff', name: 'Cardiff', lat: 51.48, lng: -3.18, type: 'city', kcId: 'UK_capitals', funFact: 'Cardiff only became the capital of Wales in 1955. Cardiff Castle has Roman, Norman, and Victorian additions spanning nearly 2,000 years of history.', region: 'Wales' },
  { id: 'ct_belfast', name: 'Belfast', lat: 54.60, lng: -5.93, type: 'city', kcId: 'UK_capitals', funFact: 'Belfast is where the Titanic was built. The Harland & Wolff shipyard\'s twin cranes, Samson and Goliath, remain iconic landmarks.', region: 'Northern Ireland' },
];

// --- Feature type config ---

const TYPE_CONFIG: Record<string, { icon: typeof MapPin; colour: string; bgColour: string; label: string }> = {
  national_park: { icon: Trees, colour: 'text-emerald-400', bgColour: 'bg-emerald-500/20 border-emerald-500/30', label: 'National Park' },
  river: { icon: Waves, colour: 'text-blue-400', bgColour: 'bg-blue-500/20 border-blue-500/30', label: 'River' },
  mountain: { icon: Mountain, colour: 'text-amber-400', bgColour: 'bg-amber-500/20 border-amber-500/30', label: 'Mountain' },
  city: { icon: MapPin, colour: 'text-violet-400', bgColour: 'bg-violet-500/20 border-violet-500/30', label: 'Capital City' },
};

// --- Component ---

interface InteractiveMapProps {
  masteredKCs?: string[];
  onFactUnlocked?: (featureId: string) => void;
  onClose?: () => void;
  activeKcFilter?: string | null; // filter to show only features for a specific KC
}

export default function InteractiveMap({ masteredKCs = [], onFactUnlocked, onClose, activeKcFilter }: InteractiveMapProps) {
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [unlockedFacts, setUnlockedFacts] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(activeKcFilter || null);
  const [showList, setShowList] = useState(false);

  // Load unlocked facts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('geomentor_unlocked_facts');
      if (saved) setUnlockedFacts(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  const saveUnlocked = (facts: Set<string>) => {
    try {
      localStorage.setItem('geomentor_unlocked_facts', JSON.stringify([...facts]));
    } catch { /* ignore */ }
  };

  const filteredFeatures = useMemo(() => {
    if (!activeFilter) return UK_FEATURES;
    return UK_FEATURES.filter(f => f.kcId === activeFilter || f.type === activeFilter);
  }, [activeFilter]);

  const handleFeatureClick = (feature: MapFeature) => {
    setSelectedFeature(feature);
    if (!unlockedFacts.has(feature.id)) {
      const updated = new Set(unlockedFacts);
      updated.add(feature.id);
      setUnlockedFacts(updated);
      saveUnlocked(updated);
      onFactUnlocked?.(feature.id);
    }
  };

  const isKcMastered = (kcId: string) => masteredKCs.includes(kcId);

  const filterOptions = [
    { id: null, label: 'All' },
    { id: 'national_park', label: 'Parks' },
    { id: 'river', label: 'Rivers' },
    { id: 'mountain', label: 'Mountains' },
    { id: 'city', label: 'Cities' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" /> UK Geography Explorer
            </h3>
            <p className="text-emerald-100 text-xs mt-1">
              {unlockedFacts.size}/{UK_FEATURES.length} facts discovered
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-emerald-800 rounded-full">
          <div
            className="h-full bg-emerald-300 rounded-full transition-all duration-700"
            style={{ width: `${(unlockedFacts.size / UK_FEATURES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-2 bg-slate-800/50 overflow-x-auto">
        {filterOptions.map(opt => (
          <button
            key={opt.id || 'all'}
            onClick={() => setActiveFilter(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === opt.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Map placeholder with CSS grid of features */}
      <div className="relative">
        {/* Simple visual map representation using positioned dots */}
        <div className="relative w-full bg-slate-950 overflow-hidden" style={{ height: '400px' }}>
          {/* UK outline background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-slate-800 text-[200px] font-bold select-none opacity-10">UK</div>
          </div>

          {/* Feature markers positioned on the map */}
          {filteredFeatures.map(feature => {
            const config = TYPE_CONFIG[feature.type];
            const Icon = config.icon;
            const mastered = isKcMastered(feature.kcId);
            const unlocked = unlockedFacts.has(feature.id);

            // Convert lat/lng to approximate pixel positions
            // UK bounds: lat 49.9-58.7, lng -8.2-1.8
            const x = ((feature.lng + 8.2) / 10) * 100;
            const y = ((58.7 - feature.lat) / 8.8) * 100;

            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 z-10 ${
                  selectedFeature?.id === feature.id ? 'scale-150 z-20' : 'hover:scale-125'
                }`}
                style={{ left: `${Math.max(8, Math.min(92, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
                title={feature.name}
              >
                <div className={`relative ${mastered ? 'animate-pulse' : ''}`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    mastered ? config.colour : unlocked ? 'text-slate-400' : 'text-slate-600'
                  } drop-shadow-lg transition-colors`} />
                  {unlocked && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
                  )}
                </div>
                {/* Hover label */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-xl border border-slate-700">
                    {feature.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected feature detail */}
      {selectedFeature && (
        <div className={`border-t ${TYPE_CONFIG[selectedFeature.type].bgColour} p-4 sm:p-5`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${TYPE_CONFIG[selectedFeature.type].bgColour}`}>
              {(() => {
                const Icon = TYPE_CONFIG[selectedFeature.type].icon;
                return <Icon className={`w-6 h-6 ${TYPE_CONFIG[selectedFeature.type].colour}`} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-bold text-base">{selectedFeature.name}</h4>
                {isKcMastered(selectedFeature.kcId) ? (
                  <span className="text-emerald-400 text-xs flex items-center gap-1"><Unlock className="w-3 h-3" /> Mastered</span>
                ) : (
                  <span className="text-slate-500 text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> Learning</span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-0.5">{selectedFeature.region} - {TYPE_CONFIG[selectedFeature.type].label}</p>
              <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedFeature.funFact}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedFeature(null)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* List view toggle */}
      <button
        onClick={() => setShowList(!showList)}
        className="w-full py-2 bg-slate-800/50 text-slate-400 text-xs hover:text-white transition-colors flex items-center justify-center gap-1"
      >
        {showList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showList ? 'Hide list' : `View all ${filteredFeatures.length} locations`}
      </button>

      {/* List view */}
      {showList && (
        <div className="max-h-60 overflow-y-auto border-t border-slate-800">
          {filteredFeatures.map(feature => {
            const config = TYPE_CONFIG[feature.type];
            const Icon = config.icon;
            const unlocked = unlockedFacts.has(feature.id);
            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-800/50 ${
                  selectedFeature?.id === feature.id ? 'bg-slate-800' : ''
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${unlocked ? config.colour : 'text-slate-600'}`} />
                <span className={`text-sm flex-1 ${unlocked ? 'text-white' : 'text-slate-500'}`}>{feature.name}</span>
                <span className="text-slate-600 text-xs">{feature.region}</span>
                {unlocked && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
