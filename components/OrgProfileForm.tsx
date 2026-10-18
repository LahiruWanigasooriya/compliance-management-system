import React from 'react';
import { Building, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { OrganizationProfile } from '../types/sysconfig.types';

interface Props {
  data: OrganizationProfile;
  onChange: (field: keyof OrganizationProfile, value: string) => void;
}

export const OrgProfileForm: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
        <Building className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-800">Organization Profile</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Organization Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="e.g. Acme Inc"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Contact Email
          </label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => onChange('contactEmail', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Phone Number
          </label>
          <input
            type="tel"
            value={data.contactPhone}
            onChange={(e) => onChange('contactPhone', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Website
          </label>
          <input
            type="url"
            value={data.website}
            onChange={(e) => onChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Address
          </label>
          <textarea
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          />
        </div>
      </div>
    </div>
  );
};