import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Import Types and Constants
import { OrganizationSettings, OrganizationProfile, BrandingSettings, LocalizationSettings } from '../../../types/sysconfig.types';
import { DEFAULT_ORG_SETTINGS } from '../../../constants/sysconfig.constants';

// Import Sub-components
import { OrgProfileForm } from '../../OrgProfileForm';
import { BrandingSettings as BrandingForm } from '../../BrandingSettings';
import { LocalizationSettings as LocalizationForm } from '../../LocalizationSettings';

export default function OrganizationSettingsPage() {
  const [settings, setSettings] = useState<OrganizationSettings>(DEFAULT_ORG_SETTINGS);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Handlers for specific section updates
  const handleProfileChange = (field: keyof OrganizationProfile, value: string) => {
    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
    setSaveStatus('idle'); // Reset status on edit
  };

  const handleBrandingChange = (field: keyof BrandingSettings, value: string) => {
    setSettings((prev) => ({ ...prev, branding: { ...prev.branding, [field]: value } }));
    setSaveStatus('idle');
  };

  const handleLocalizationChange = (field: keyof LocalizationSettings, value: string) => {
    setSettings((prev) => ({ ...prev, localization: { ...prev.localization, [field]: value } }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus('idle');

    // Simulate API Call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Implementation: await api.updateOrgSettings(settings);
      setSaveStatus('success');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
            <p className="text-slate-500 mt-1">Manage your tenant profile, branding, and regional preferences.</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all shadow-sm
              ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95'}
            `}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Feedback Messages */}
        {saveStatus === 'success' && (
          <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-700 flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">Settings saved successfully. Changes applied system-wide.</p>
          </div>
        )}
        {saveStatus === 'error' && (
           <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Failed to save settings. Please try again.</p>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-6">
            
          {/* Scenario 1: Organization Profile */}
          <section>
            <OrgProfileForm 
              data={settings.profile} 
              onChange={handleProfileChange} 
            />
          </section>

          {/* Scenario 2: Branding */}
          <section>
            <BrandingForm 
              data={settings.branding} 
              onChange={handleBrandingChange} 
            />
          </section>

          {/* Scenario 2: Localization */}
          <section>
             <LocalizationForm 
               data={settings.localization} 
               onChange={handleLocalizationChange} 
             />
          </section>

        </div>
      </div>
    </div>
  );
}