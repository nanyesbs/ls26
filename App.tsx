
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import ParticipantCard from './components/ParticipantCard';
import ProfileModal from './components/ProfileModal';
import AdminConsole from './components/AdminConsole';
import { Participant, ViewMode, Country } from './types';
import { api } from './services/api';
import { COUNTRY_LIST, ALPHABET_GROUPS } from './constants';
import { sortParticipants, normalizeString, convertDriveUrl } from './utils';
import { syncService } from './services/syncService';
import { Search, ShieldCheck, Users, Loader2, LayoutGrid, Moon, Sun, Globe, Building, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ls_theme');
    return saved ? saved === 'dark' : false;
  });

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);

  const [filterCountryCode, setFilterCountryCode] = useState<string>('ALL');
  const [filterMinistry, setFilterMinistry] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const [filterLetter, setFilterLetter] = React.useState<string>('ALL');

  const participantsRef = React.useRef<Participant[]>([]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    loadData();
    // Initial background sync after a short delay
    const initialSyncTimer = setTimeout(() => {
      performBackgroundSync();
    }, 5000);

    // Periodic sync every 15 minutes
    const interval = setInterval(() => {
      performBackgroundSync();
    }, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(interval);
    };
  }, []);

  const performBackgroundSync = async () => {
    try {
      // 1. Get the latest master sheet URL from Supabase settings
      const settings = await api.getSettings();
      const masterUrl = settings.sheet_url;

      // Prefer master URL, fallback to local (for development/overrides)
      const sheetUrl = masterUrl || localStorage.getItem('ls_sheet_url');

      if (!sheetUrl) return;

      console.log('Starting automated background sync...');
      // 2. Perform efficient batch sync (direct DB upsert)
      await syncService.batchSyncFromSheet(sheetUrl);

      // 3. Reload data locally to reflect changes
      const freshData = await api.getParticipants();

      const correctedData = freshData.map(p => ({
        ...p,
        photoUrl: (p.photoUrl?.includes('drive.google.com') || p.photoUrl?.includes('lh3.googleusercontent.com'))
          ? convertDriveUrl(p.photoUrl)
          : p.photoUrl,
        promoPhotoUrl: (p.promoPhotoUrl?.includes('drive.google.com') || p.promoPhotoUrl?.includes('lh3.googleusercontent.com'))
          ? convertDriveUrl(p.promoPhotoUrl)
          : p.promoPhotoUrl
      }));

      setParticipants(correctedData);
      console.log('Automated sync completed successfully.');

      // If we used a master URL, update local storage to match
      if (masterUrl) localStorage.setItem('ls_sheet_url', masterUrl);
    } catch (err) {
      console.error('Background sync failed:', err);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ls_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ls_theme', 'light');
    }
  }, [darkMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getParticipants();

      // Hotfix: Ensure any existing participants with broken/session-tied Drive links are corrected on-the-fly
      const correctedData = data.map(p => ({
        ...p,
        photoUrl: (p.photoUrl?.includes('drive.google.com') || p.photoUrl?.includes('lh3.googleusercontent.com'))
          ? convertDriveUrl(p.photoUrl)
          : p.photoUrl,
        promoPhotoUrl: (p.promoPhotoUrl?.includes('drive.google.com') || p.promoPhotoUrl?.includes('lh3.googleusercontent.com'))
          ? convertDriveUrl(p.promoPhotoUrl)
          : p.promoPhotoUrl
      }));

      setParticipants(correctedData);
    } catch (err) {
      console.error('Core Offline');
    } finally {
      setLoading(false);
    }
  };

  const activeCountries = useMemo(() => {
    const codesInUse = new Set(participants.map(p => p.country.code));
    return COUNTRY_LIST.filter(c => codesInUse.has(c.code));
  }, [participants]);

  const uniqueMinistries = useMemo(() => Array.from(new Set(participants.map(p => p.organization))).sort(), [participants]);
  const uniqueRoles = useMemo(() => Array.from(new Set(participants.map(p => p.title))).sort(), [participants]);

  const filteredParticipants = useMemo(() => {
    const results = participants.filter(p => {
      const q = normalizeString(searchQuery);
      const matchesSearch = !q || p.searchName.includes(q) || p.searchOrg.includes(q);
      const matchesCountry = filterCountryCode === 'ALL' || p.country.code === filterCountryCode;
      const matchesMinistry = filterMinistry === 'ALL' || p.organization === filterMinistry;
      const matchesRole = filterRole === 'ALL' || p.title === filterRole;

      let matchesLetter = true;
      if (filterLetter !== 'ALL') {
        matchesLetter = (p.searchName || '').charAt(0) === filterLetter;
      }

      return matchesSearch && matchesCountry && matchesMinistry && matchesRole && matchesLetter;
    });
    // Apply sorting to the filtered list
    return sortParticipants(results);
  }, [participants, searchQuery, filterCountryCode, filterMinistry, filterRole, filterLetter]);

  const handleAdd = async (p: Omit<Participant, 'id'>) => {
    const fresh = await api.addParticipant(p);
    setParticipants(prev => [...prev, fresh]);
  };

  const handleUpdate = async (id: string, updates: Partial<Participant>) => {
    const updated = await api.updateParticipant(id, updates);
    setParticipants(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleDelete = async (id: string) => {
    await api.deleteParticipant(id);
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (selectedParticipant?.id === id) setSelectedParticipant(null);
  };

  const availableLetters = useMemo(() => {
    const letters = new Set(participants.map(p => (p.searchName || '').charAt(0).toUpperCase()));
    return letters;
  }, [participants]);

  const sortedAlphabet = useMemo(() => {
    return ALPHABET_GROUPS.LATIN.filter(char => availableLetters.has(char));
  }, [availableLetters]);

  return (
    <div className="min-h-screen transition-colors duration-500 bg-black dark:bg-white pt-16">
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdminAuthorized={isAdminAuthorized}
      />

      {viewMode === 'directory' && <Header darkMode={darkMode} />}

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-24 md:py-32">
        <div className="flex flex-col gap-20 mb-32">
          {viewMode === 'directory' && (
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-10 border-b border-white/10 dark:border-black/5 pb-8 md:pb-10">
              <div className="flex flex-col">
                <h2 className="text-2xl font-avenir-bold text-white dark:text-black uppercase tracking-tighter">Identity Core</h2>
                <p className="text-[10px] text-white/40 dark:text-black/40 uppercase tracking-[0.2em]">Synchronized Database Nodes</p>
              </div>

              <div className="relative w-full xl:w-[350px]">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-heaven-gold" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/5 p-3 pl-11 text-[12px] font-avenir-medium text-white dark:text-black outline-none focus:border-brand-heaven-gold transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {viewMode === 'directory' && !loading && (
            <div className="space-y-12">
              {/* Alphabet Filter */}
              <div className="sticky top-0 z-50 py-6 mb-8 mix-blend-difference xl:mix-blend-normal">
                <div className="bg-black/80 dark:bg-white/90 backdrop-blur-xl border border-white/10 dark:border-black/5 p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shadow-2xl">
                  <button
                    onClick={() => setFilterLetter('ALL')}
                    className={`h-9 px-4 flex items-center justify-center text-[10px] font-avenir-bold transition-all ${filterLetter === 'ALL' ? 'bg-brand-heaven-gold text-white' : 'text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black'}`}
                  >
                    ALL
                  </button>
                  <div className="w-[1px] h-4 bg-white/10 dark:bg-black/10 mx-2" />

                  {/* English A-Z (Normalized Filter) - Automatic detection */}
                  {ALPHABET_GROUPS.LATIN.map(char => {
                    const isAvailable = availableLetters.has(char);
                    return (
                      <button
                        key={char}
                        onClick={() => setFilterLetter(char)}
                        disabled={!isAvailable}
                        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center text-[11px] font-avenir-bold transition-all ${filterLetter === char
                          ? 'bg-white dark:bg-black text-black dark:text-white'
                          : isAvailable
                            ? 'text-white/80 dark:text-black/80 hover:bg-white/10 dark:hover:bg-black/10 hover:text-white dark:hover:text-black'
                            : 'text-white/10 dark:text-black/10 cursor-not-allowed'
                          }`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 bg-white/5 dark:bg-black/5 border border-white/5 dark:border-black/5 p-5 md:p-8 rounded-card shadow-card">
                <div className="space-y-4">
                  <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2">
                    <Globe size={12} /> Geographic Hub
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilterCountryCode('ALL')} className={`px-3 py-1.5 text-[10px] font-avenir-medium rounded-button border ${filterCountryCode === 'ALL' ? 'bg-brand-heaven-gold text-white border-brand-heaven-gold' : 'border-white/10 dark:border-black/10 text-white dark:text-black opacity-50'}`}>Global</button>
                    {activeCountries.map(c => (
                      <button key={c.code} onClick={() => setFilterCountryCode(c.code)} className={`px-3 py-1.5 text-[10px] font-avenir-medium rounded-button border ${filterCountryCode === c.code ? 'bg-white dark:bg-black text-black dark:text-white border-white dark:border-black' : 'border-white/10 dark:border-black/10 text-white dark:text-black opacity-50'}`}>{c.code}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2">
                    <Building size={12} /> Ministry
                  </span>
                  <select value={filterMinistry} onChange={e => setFilterMinistry(e.target.value)} className="w-full bg-black/40 dark:bg-white border border-white/10 dark:border-black/10 p-3 rounded-button text-[11px] font-avenir-medium text-white dark:text-black outline-none focus:border-brand-heaven-gold">
                    <option value="ALL">All Organizations</option>
                    {uniqueMinistries.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2">
                    <Briefcase size={12} /> Capacity
                  </span>
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="w-full bg-black/40 dark:bg-white border border-white/10 dark:border-black/10 p-3 rounded-button text-[11px] font-avenir-medium text-white dark:text-black outline-none focus:border-brand-heaven-gold">
                    <option value="ALL">All Leadership Roles</option>
                    {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-brand-heaven-gold mb-4" size={32} />
            <p className="text-[10px] text-brand-heaven-gold uppercase font-avenir-medium tracking-widest">Synchronizing Identity Stream...</p>
          </div>
        ) : viewMode === 'directory' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredParticipants.map(p => (
              <ParticipantCard key={p.id} participant={p} onClick={() => setSelectedParticipant(p)} />
            ))}
          </div>
        ) : (
          <AdminConsole
            participants={participants}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isAuthorized={isAdminAuthorized}
            onAuthorize={setIsAdminAuthorized}
            editingId={activeEditingId}
            onSetEditingId={setActiveEditingId}
          />
        )}
      </main>

      <footer className="mt-40 border-t border-white/5 dark:border-black/5 py-32 bg-black dark:bg-white text-center">
        <div className="max-w-[1400px] mx-auto px-8 space-y-10">
          <p className="font-didot italic text-3xl text-white/30 dark:text-black/20 max-w-3xl mx-auto leading-relaxed">
            "History is defined by the dedicated few who lead with purpose."
          </p>
          <div className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px]">
            Leaders' Summit 2026 Stuttgart
          </div>
        </div>
      </footer>

      <ProfileModal
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        isAdmin={isAdminAuthorized}
        onDelete={handleDelete}
        onEdit={(id) => { setSelectedParticipant(null); setActiveEditingId(id); setViewMode('admin'); }}
      />
    </div>
  );
};

export default App;
