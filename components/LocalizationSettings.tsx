import React from 'react';
import { Globe as GlobeIcon, Clock, Map } from 'lucide-react';
import { LocalizationSettings as LocType } from '../types/sysconfig.types';
import { TIMEZONES, REGIONS, LANGUAGES, DATE_FORMATS } from '../constants/sysconfig.constants';

interface Props {
  data: LocType;
  onChange: (field: keyof LocType, value: string) => void;
}

export const LocalizationSettings: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
        <GlobeIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-800">Localization & Regional</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Default Timezone
          </label>
          <select
            value={data.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Map className="w-3 h-3" /> Data Region
          </label>
          <select
            value={data.region}
            onChange={(e) => onChange('region', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
             {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">System Language</label>
          <select
            value={data.language}
            onChange={(e) => onChange('language', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Date Format</label>
          <select
            value={data.dateFormat}
            onChange={(e) => onChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
             {DATE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};