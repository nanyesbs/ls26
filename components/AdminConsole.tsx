import React, { useState, useRef, useEffect } from 'react';
import { Participant, Country } from '../types';
import { ADMIN_PASSWORD, COUNTRY_LIST, getIdentityPlaceholder } from '../constants';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { syncService } from '../services/syncService';
import { sortParticipants, fixEncoding, processParticipant, normalizeString, stripEmojis, findCountry } from '../utils';
import {
  Lock, Edit2, Trash2, X, ShieldCheck,
  Image as ImageIcon, UploadCloud, Camera, History,
  RefreshCw, Loader2, FileSpreadsheet, CheckCircle2,
  Upload, Sparkles, AlertCircle, Search
} from 'lucide-react';

interface AdminConsoleProps {
  participants: Participant[];
  onAdd: (p: Omit<Participant, 'id'>) => Promise<void>;
  onUpdate: (id: string, p: Partial<Participant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAuthorized: boolean;
  onAuthorize: (v: boolean) => void;
  editingId: string | null;
  onSetEditingId: (id: string | null) => void;
}

interface ImportReport {
  total: number;
  imported: number;
  duplicates: number;
  issues: { name: string; email: string; fields: string[] }[];
}

const AdminConsole: React.FC<AdminConsoleProps> = ({
  participants, onAdd, onUpdate, onDelete,
  isAuthorized, onAuthorize, editingId, onSetEditingId
}) => {
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Participant>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [pendingData, setPendingData] = useState<{ p: Omit<Participant, 'id'>, id?: string }[]>([]);
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('ls_sheet_url') || '');
  const [searchTerm, setSearchTerm] = useState('');

  const importInputRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const promoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      const p = participants.find(part => part.id === editingId);
      if (p) {
        setFormData(p);
        setIsAdding(true);
      }
    }
  }, [editingId, participants]);

  const selectCountry = (field: 'country' | 'nationality', code: string) => {
    const country = COUNTRY_LIST.find(c => c.code === code);
    if (country) {
      setFormData(prev => ({ ...prev, [field]: country }));
    }
  };

  useEffect(() => {
    if (sheetUrl) {
      localStorage.setItem('ls_sheet_url', sheetUrl);
    }
  }, [sheetUrl]);

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required.');
    try {
      const processed = processParticipant(formData);
      console.log('Attempting to sync identity node:', processed);

      // Sanitize payload to remove UI-only keys that might confuse Supabase if not in schema cache
      // We only send keys that we know are valid columns or that api.updateParticipant can handle
      const {
        searchName, searchOrg, // Remove generated UI fields
        contactEmail, shortBio, upcomingEvents, dietaryRestrictions, // Remove camelCase if they are not in schema cache yet or if mapping is handled inside API
        ...safePayload
      } = processed;

      // Add back the mapped snake_case fields if needed, OR rely on api.ts to do the mapping.
      // Since api.updateParticipant takes Partial<Participant>, we should send the interface props.
      // BUT, if Supabase complains about 'contactEmail' not found, it means it's trying to map it directly.
      // So we must ensure we are NOT sending 'contactEmail' if the DB column is 'contact_email'.

      // Let's manually construct the update payload to be safe
      const updatePayload: any = {
        ...safePayload,
        // Map explicitly to snake_case for the direct update if strictly required,
        // or ensure the API function handles the mapping.
        // Currently api.updateParticipant just passes 'updates' to .update(updates).
        // So we MUST map to snake_case here if the DB expects it.
        contact_email: processed.contactEmail,
        short_bio: processed.shortBio,
        upcoming_events: processed.upcomingEvents,
        dietary_restrictions: processed.dietaryRestrictions
      };

      if (editingId) {
        console.log('Update Mode: Target ID', editingId);
        await onUpdate(editingId, updatePayload);
      } else {
        console.log('Creation Mode: New Node');
        await onAdd(processed as Omit<Participant, 'id'>);
      }

      setFormData({});
      onSetEditingId(null);
      setIsAdding(false);
      alert('Identity Node Synchronized Successfully.');
    } catch (err: any) {
      console.error('Critical Sync Failure:', err);
      alert(`Sync failure: ${err.message || 'Check console logs for stack trace.'}`);
    }
  };


  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportReport(null);
    setPendingData([]);
    setImportProgress('Syncing Manifest...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const report = syncService.processDataRows(data, participants);
        setPendingData(report.valid);
        setImportReport({
          total: report.total,
          imported: report.valid.length,
          duplicates: report.duplicateCount,
          issues: []
        });
      } catch (err) {
        alert('Data corruption in file.');
      } finally {
        setIsImporting(false);
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleCloudSync = async () => {
    if (!sheetUrl) return alert('Enter Sheet URL');
    setIsImporting(true);
    setImportProgress('Fetching Cloud Data...');

    try {
      const results = await syncService.fetchFromSheet(sheetUrl, participants);
      setPendingData(results.valid);
      setImportReport({
        total: results.total,
        imported: results.valid.length,
        duplicates: results.duplicateCount,
        issues: []
      });
      setImportProgress('Ready to Commit');
    } catch (err) {
      alert('Cloud sync failed. Ensure the sheet is "Published to web" as CSV or set to "Anyone with link can view".');
    } finally {
      setIsImporting(false);
    }
  };

  const confirmImport = async () => {
    setIsImporting(true);
    try {
      await syncService.performSync(
        pendingData,
        (msg) => setImportProgress(msg),
        onAdd,
        onUpdate
      );
      setPendingData([]); setImportReport(null);
      alert('Sync successful.');
    } catch {
      alert('Partial sync failure.');
    } finally {
      setIsImporting(false);
    }
  };

  const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'promoPhotoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(prev => ({ ...prev, [field]: true }));
      const reader = new FileReader();
      reader.onload = async (event) => {
        const resized = await resizeImage(event.target?.result as string);
        setFormData(prev => ({ ...prev, [field]: resized }));
        setIsUploading(prev => ({ ...prev, [field]: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 rounded-card shadow-card mt-10">
        <Lock size={40} className="text-brand-heaven-gold mb-6" />
        <h2 className="text-lg font-avenir-bold uppercase text-white dark:text-black mb-8">Authorization Required</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (password === ADMIN_PASSWORD) onAuthorize(true); else alert('DENIED'); }} className="flex flex-col items-center w-full max-w-xs space-y-4">
          <input type="password" placeholder="SECURE CODE" className="w-full bg-black/40 dark:bg-white border border-white/10 dark:border-stone-200 p-4 rounded-button text-center outline-none focus:border-brand-heaven-gold" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full py-4 bg-brand-heaven-gold text-white font-avenir-bold uppercase rounded-button hover:brightness-110 transition-all">Authorize</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-10 pb-24 animate-fade-in text-white transition-colors">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-avenir-bold text-white dark:text-black uppercase tracking-tight">Admin Protocol</h2>
        <button onClick={() => onAuthorize(false)} className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-button text-[10px] font-avenir-bold uppercase transition-all">Secure Logout</button>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Registrations Card */}
        <div className="bg-gradient-to-br from-brand-heaven-gold/20 to-brand-heaven-gold/5 border border-brand-heaven-gold/30 p-8 rounded-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-heaven-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brand-heaven-gold/20 rounded-full flex items-center justify-center">
                <ShieldCheck size={24} className="text-brand-heaven-gold" />
              </div>
              <div>
                <p className="text-[9px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-[3px]">Total Registrations</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-avenir-bold text-brand-heaven-gold">{participants.length}</span>
              <span className="text-sm text-white/40 dark:text-black/40 font-avenir-roman">participants</span>
            </div>
          </div>
        </div>

        {/* Daily Registrations Card */}
        <div className="bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-8 rounded-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 dark:bg-stone-100 rounded-full flex items-center justify-center">
              <History size={24} className="text-brand-heaven-gold" />
            </div>
            <div>
              <p className="text-[9px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-[3px]">Registration Activity</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
            {(() => {
              // Group participants by registration date
              const dateGroups: Record<string, number> = {};
              participants.forEach(p => {
                const dateStr = p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : 'Unknown';
                dateGroups[dateStr] = (dateGroups[dateStr] || 0) + 1;
              });

              // Sort by date (most recent first)
              const sortedDates = Object.entries(dateGroups)
                .filter(([date]) => date !== 'Unknown')
                .sort((a, b) => {
                  const [dayA, monthA, yearA] = a[0].split('/').map(Number);
                  const [dayB, monthB, yearB] = b[0].split('/').map(Number);
                  return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
                });

              // Add unknown at the end if exists
              if (dateGroups['Unknown']) {
                sortedDates.push(['Unknown', dateGroups['Unknown']]);
              }

              if (sortedDates.length === 0) {
                return (
                  <div className="text-center py-4">
                    <p className="text-[11px] text-white/30 dark:text-stone-400 italic">No registration data available</p>
                  </div>
                );
              }

              return sortedDates.map(([date, count]) => (
                <div key={date} className="flex items-center justify-between p-3 bg-black/20 dark:bg-white border border-white/5 dark:border-stone-100 rounded-lg">
                  <span className="text-[11px] font-avenir-bold text-white dark:text-black">{date}</span>
                  <span className="px-3 py-1 bg-brand-heaven-gold/20 text-brand-heaven-gold text-[10px] font-avenir-bold rounded-full">
                    {count} {count === 1 ? 'registro' : 'registros'}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Import Section */}
      <section className="bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-8 rounded-card relative overflow-hidden">
        {isImporting && (
          <div className="absolute inset-0 z-50 bg-brand-heaven-gold/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-[12px] font-avenir-bold uppercase tracking-[4px]">{importProgress}</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-heaven-gold/10 rounded-full flex items-center justify-center text-brand-heaven-gold"><FileSpreadsheet size={32} /></div>
            <div>
              <h3 className="text-lg font-avenir-bold text-white dark:text-black uppercase">Batch Import Protocol</h3>
              <p className="text-[10px] text-white/40 dark:text-stone-400 mt-1 uppercase">Cloud Database Synchronization</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste Google Sheet URL"
                className="bg-black/20 dark:bg-white border border-white/10 dark:border-stone-200 px-4 py-2 rounded-button text-[10px] w-64 outline-none focus:border-brand-heaven-gold text-white dark:text-black"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <button
                onClick={handleCloudSync}
                className="px-6 py-2 bg-brand-heaven-gold/20 text-brand-heaven-gold border border-brand-heaven-gold/20 rounded-button text-[10px] font-avenir-bold uppercase hover:bg-brand-heaven-gold/30 transition-all flex items-center gap-2"
              >
                <Sparkles size={14} /> Cloud Sync
              </button>
            </div>
            <div className="flex gap-2">
              {pendingData.length > 0 ? (
                <button onClick={confirmImport} className="w-full py-3 bg-green-500 text-white text-[10px] font-avenir-bold uppercase rounded-button flex items-center justify-center gap-3 animate-pulse">
                  <CheckCircle2 size={16} /> Confirm Cloud Save ({pendingData.length})
                </button>
              ) : (
                <button onClick={() => importInputRef.current?.click()} className="w-full py-3 bg-white/5 border border-white/10 text-white dark:text-black dark:border-stone-200 text-[10px] font-avenir-bold uppercase rounded-button flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                  <Upload size={16} /> Manual File Upload
                </button>
              )}
            </div>
            <input type="file" ref={importInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileImport} />
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-10 relative items-start">
        {/* Ledger List */}
        <div className="flex-1 bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-8 rounded-card w-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-avenir-bold uppercase text-white dark:text-black flex items-center gap-2">
              <History size={14} className="text-brand-heaven-gold" /> Identity Ledger
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button onClick={async () => { if (confirm('WARNING: This will delete ALL participants from the Supabase database. Are you sure?')) { await api.resetData(); window.location.reload(); } }} className="text-[10px] font-avenir-bold text-red-500/50 uppercase hover:text-red-500">Factory Reset</button>
                <button onClick={() => { setIsAdding(true); onSetEditingId(null); setFormData({}); }} className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase hover:underline">Manual Initialization +</button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-heaven-gold/50" />
                <input
                  type="text"
                  placeholder="Filter by name or organization..."
                  className="w-full bg-black/40 dark:bg-white border border-white/10 dark:border-stone-200 p-3 pl-10 rounded-button text-[11px] text-white dark:text-black outline-none focus:border-brand-heaven-gold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3 max-h-[660px] overflow-y-auto pr-2 custom-scrollbar">
            {sortParticipants<Participant>(
              participants.filter(p =>
                !searchTerm ||
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.organization.toLowerCase().includes(searchTerm.toLowerCase())
              )
            ).map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-black/20 dark:bg-white border border-white/5 dark:border-stone-200 rounded-card hover:border-brand-heaven-gold/30">
                <div className="flex items-center gap-4">
                  <img src={p.photoUrl || getIdentityPlaceholder(p.name)} className="w-10 h-10 rounded-full object-cover border border-brand-heaven-gold/20" />
                  <div>
                    <div className="text-[11px] font-avenir-bold text-white dark:text-black uppercase">{p.name}</div>
                    <div className="text-[9px] text-white/30 dark:text-stone-400 uppercase">{p.country.code} • {p.title}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onSetEditingId(p.id)} className="p-2 text-white/20 dark:text-stone-300 hover:text-brand-heaven-gold"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(p.id)} className="p-2 text-white/20 dark:text-stone-300 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Form Modal */}
        {isAdding && (
          <div className="w-full lg:w-[600px] bg-black dark:bg-white border border-brand-heaven-gold/40 rounded-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in sticky top-24">
            <div className="flex justify-between items-center p-6 border-b border-white/10 dark:border-stone-100 bg-white/5 dark:bg-stone-50">
              <h4 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.2em]">
                {editingId ? 'Modify Identity Node' : 'Initialize New Node'}
              </h4>
              <button onClick={() => { setIsAdding(false); onSetEditingId(null); setFormData({}); }} className="hover:rotate-90 transition-all duration-300"><X size={20} className="text-white/20 dark:text-stone-400" /></button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 dark:bg-black/5 rounded-card border border-white/5">
                <div className="space-y-3">
                  <label className="text-[8px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest">Portrait URL or Upload</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Paste URL..."
                      className="w-full bg-white/5 border border-white/10 p-2 rounded text-xs text-white"
                      value={formData.photoUrl || ''}
                      onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                    />
                    <div onClick={() => profileFileRef.current?.click()} className="py-2 px-3 bg-white/5 border border-dashed border-white/20 rounded cursor-pointer hover:bg-white/10 flex items-center justify-center gap-2 text-[10px] uppercase text-white/60 hover:text-white transition-all">
                      <UploadCloud size={14} /> Upload File
                    </div>
                  </div>
                  {formData.photoUrl && (
                    <div className="aspect-square rounded-card border-2 border-white/10 overflow-hidden relative mt-2">
                      <img src={formData.photoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input type="file" ref={profileFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'photoUrl')} />
                </div>
                <div className="space-y-3">
                  <label className="text-[8px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest">Promotional URL or Upload</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Paste URL..."
                      className="w-full bg-white/5 border border-white/10 p-2 rounded text-xs text-white"
                      value={formData.promoPhotoUrl || ''}
                      onChange={e => setFormData({ ...formData, promoPhotoUrl: e.target.value })}
                    />
                    <div onClick={() => promoFileRef.current?.click()} className="py-2 px-3 bg-white/5 border border-dashed border-white/20 rounded cursor-pointer hover:bg-white/10 flex items-center justify-center gap-2 text-[10px] uppercase text-white/60 hover:text-white transition-all">
                      <UploadCloud size={14} /> Upload File
                    </div>
                  </div>
                  {formData.promoPhotoUrl && (
                    <div className="aspect-square rounded-card border-2 border-white/10 overflow-hidden relative mt-2">
                      <img src={formData.promoPhotoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input type="file" ref={promoFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'promoPhotoUrl')} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Full Name</label>
                  <input className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Residency</label>
                    <select className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-2 rounded-button text-[11px] text-white dark:text-black outline-none" value={formData.country?.code || ''} onChange={(e) => selectCountry('country', e.target.value)}>
                      {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Nationality</label>
                    <select className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-2 rounded-button text-[11px] text-white dark:text-black outline-none" value={formData.nationality?.code || ''} onChange={(e) => selectCountry('nationality', e.target.value)}>
                      {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Short Biography</label>
                  <textarea className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold min-h-[80px] resize-none" value={formData.testimony || ''} onChange={e => setFormData({ ...formData, testimony: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Organization</label>
                    <input className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.organization || ''} onChange={e => setFormData({ ...formData, organization: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Title</label>
                    <input className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Organization Description</label>
                  <textarea className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold min-h-[60px] resize-none" value={formData.orgDescription || ''} onChange={e => setFormData({ ...formData, orgDescription: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Email Address</label>
                    <input type="email" className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Phone Number</label>
                    <input className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Website</label>
                  <input className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest">Other Information</label>
                  <input className="w-full bg-white/5 dark:bg-stone-50 border border-white/10 dark:border-stone-200 p-3 rounded-button text-xs text-white dark:text-black outline-none focus:border-brand-heaven-gold" value={formData.otherInfo || ''} onChange={e => setFormData({ ...formData, otherInfo: e.target.value })} />
                </div>
              </div>

              <button onClick={handleSave} className="w-full py-4 bg-brand-heaven-gold text-white font-avenir-bold uppercase rounded-button hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Sync Identity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsole;
