'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { ButtonRbac } from '@/components/ui/ButtonRbac';
import { PermissionMatrix } from '@/components/roles/PermissionMatrix';
import { ReasonModal } from '@/components/roles/ReasonModal';

export default function CreateRolePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  // State for permissions
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handlePermissionChange = (feature: string, action: string, checked: boolean) => {
    setPermissions(prev => {
      const currentActions = prev[feature] || [];
      if (checked) {
        return { ...prev, [feature]: [...currentActions, action] };
      } else {
        return { ...prev, [feature]: currentActions.filter(a => a !== action) };
      }
    });
  };

  const handleInitialSave = () => {
    if (!formData.name) {
      setError('Role Name is required');
      return;
    }
    // Simulate Duplicate Check
    if (formData.name.toLowerCase() === 'system admin') {
      setError('Role already exists');
      return;
    }
    setError('');
    setIsModalOpen(true); // Trigger mandatory reason modal
  };

  const handleFinalConfirm = (reason: string) => {
    console.log("Saving Role:", { ...formData, permissions, reason });
    setIsModalOpen(false);
    // Simulate API call and redirect
    router.push('/roles'); 
    // In real app: Show toast "Role has been created successfully"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-4">
        <Link href="/roles">
          <ButtonRbac variant="ghost" className="p-0 hover:bg-transparent text-slate-500 hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" />
          </ButtonRbac>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create New Role</h1>
      </div>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Role Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Compliance Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  maxLength={100}
                  rows={4}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Describe the responsibilities..."
                />
                <div className="text-xs text-slate-400 text-right mt-1">{formData.description.length}/100</div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <ButtonRbac onClick={handleInitialSave} className="w-full justify-center">
              <Save className="w-4 h-4 mr-2" /> Save Role
            </ButtonRbac>
            <ButtonRbac variant="secondary" onClick={() => router.back()} className="w-full justify-center">
              Discard
            </ButtonRbac>
          </div>
        </div>

        {/* Right Column: Permissions Matrix */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-full">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Permissions Configuration</h2>
              <p className="text-sm text-slate-500">Define access boundaries for different job functions.</p>
            </div>
            
            <PermissionMatrix permissions={permissions} onChange={handlePermissionChange} />
          </div>
        </div>
      </div>

      <ReasonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleFinalConfirm} 
        title="Confirm Role Creation" 
      />
    </div>
  );
}