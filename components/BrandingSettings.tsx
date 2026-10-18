import React, { useRef } from 'react';
import { Palette, Upload, Image as ImageIcon } from 'lucide-react';
import { BrandingSettings as BrandingType } from '../types/sysconfig.types';

interface Props {
  data: BrandingType;
  onChange: (field: keyof BrandingType, value: string) => void;
}

export const BrandingSettings: React.FC<Props> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Create a fake URL for preview purposes
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      onChange('logoUrl', fileUrl);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
        <Palette className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-800">Branding & Look</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo Section */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-700">Organization Logo</label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition"
              >
                <Upload className="w-4 h-4" /> Upload Logo
              </button>
              <p className="text-xs text-slate-500">Max file size: 2MB. Format: PNG, JPG.</p>
            </div>
          </div>
        </div>

        {/* Colors Section */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-700">Theme Colors</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => onChange('primaryColor', e.target.value)}
                  className="w-10 h-10 p-1 rounded cursor-pointer bg-white border border-slate-200"
                />
                <input
                    type="text"
                    value={data.primaryColor}
                    onChange={(e) => onChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.secondaryColor}
                  onChange={(e) => onChange('secondaryColor', e.target.value)}
                  className="w-10 h-10 p-1 rounded cursor-pointer bg-white border border-slate-200"
                />
                <input
                    type="text"
                    value={data.secondaryColor}
                    onChange={(e) => onChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};