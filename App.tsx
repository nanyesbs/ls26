
import React, { useState, useEffect, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import ParticipantCard from './components/ParticipantCard';
import ProfileModal from './components/ProfileModal';
import AdminConsole from './components/AdminConsole';
import RegistrationForm from './components/RegistrationForm';
import { Participant, ViewMode, Country, LayoutMode } from './types';
import { api } from './services/api';
import { COUNTRY_LIST, ALPHABET_GROUPS } from './constants';
import { sortParticipants, normalizeString, convertDriveUrl, findCountry, processParticipant } from './utils';
import { syncService } from './services/syncService';
import { Search, ShieldCheck, Users, Loader2, LayoutGrid, Moon, Sun, Globe, Building, Briefcase, Rows, Columns, Square, Filter, RefreshCcw, X } from 'lucide-react';

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('ls_layout');
    return (saved as LayoutMode) || 'grid4';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ls_theme');
    return saved ? saved === 'dark' : false;
  });

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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

      const processedData = freshData.map(p => processParticipant(p));

      setParticipants(sortParticipants(processedData));
      console.log('Automated sync completed successfully.');

      // If we used a master URL, update local storage to match
      if (masterUrl) localStorage.setItem('ls_sheet_url', masterUrl);
    } catch (err) {
      console.error('Background sync failed:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('ls_layout', layoutMode);
  }, [layoutMode]);

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

      // Hotfix: Ensure any existing participants with broken/session-tied Drive links or incorrect country mappings are corrected on-the-fly
      const correctedData = data.map(p => {
        const processed = processParticipant(p);

        // Ensure flag synchronization logic is also applied
        if (processed.country) {
          const fresh = findCountry(processed.country.name);
          if (fresh.code !== '??') processed.country = fresh;
        }

        return processed;
      });

      setParticipants(sortParticipants(correctedData));
    } catch (err) {
      console.error('Core Offline');
    } finally {
      setLoading(false);
    }
  };

  const activeCountries = useMemo(() => {
    const countries = new Map<string, Country>();
    participants.forEach(p => {
      // If valid country info exists, add it to unique filter set
      if (p.country && p.country.code !== '??') {
        countries.set(p.country.code, p.country);
      }
    });
    return Array.from(countries.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    setParticipants(prev => sortParticipants([...prev, processParticipant(fresh)]));
  };

  const handleUpdate = async (id: string, updates: Partial<Participant>) => {
    const updated = await api.updateParticipant(id, updates);
    setParticipants(prev => sortParticipants(prev.map(p => p.id === id ? processParticipant(updated) : p)));
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

  const availableCountries = useMemo(() => {
    const countries = new Map<string, Country>();
    participants.forEach(p => {
      if (p.country && p.country.code !== '??') {
        countries.set(p.country.code, p.country);
      }
    });
    return Array.from(countries.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [participants]);

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
            <div className="flex flex-col gap-10">
              {/* Refined Control Bar */}
              <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white/5 dark:bg-black/5 p-4 rounded-3xl border border-white/10 dark:border-black/5 backdrop-blur-md">
                <div className="relative flex-1 group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-heaven-gold group-focus-within:scale-110 transition-transform" />
                  <input
                    type="text"
                    placeholder="Search participants, roles, or organizations..."
                    className="w-full bg-transparent border-none p-4 pl-12 text-sm font-avenir-medium text-white dark:text-black outline-none transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 h-full px-2">
                  <button
                    onClick={() => performBackgroundSync()}
                    title="Manual Refresh"
                    className="p-3 text-brand-heaven-gold/60 hover:text-brand-heaven-gold hover:bg-white/5 dark:hover:bg-black/5 rounded-xl transition-all active:scale-95"
                  >
                    <RefreshCcw size={18} />
                  </button>

                  <div className="w-[1px] h-8 bg-white/10 dark:bg-black/10 mx-2 hidden md:block" />

                  <div className="flex gap-1">
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={`p-3 rounded-xl transition-all ${layoutMode === 'list' ? 'bg-brand-heaven-gold text-white shadow-glow' : 'text-brand-heaven-gold hover:bg-white/5 dark:hover:bg-black/5'}`}
                      title="List View"
                    >
                      <Square size={20} />
                    </button>
                    <button
                      onClick={() => setLayoutMode('grid2')}
                      className={`p-3 rounded-xl transition-all ${layoutMode === 'grid2' ? 'bg-brand-heaven-gold text-white shadow-glow' : 'text-brand-heaven-gold hover:bg-white/5 dark:hover:bg-black/5'}`}
                      title="2 Column Grid"
                    >
                      <Columns size={20} />
                    </button>
                    <button
                      onClick={() => setLayoutMode('grid4')}
                      className={`p-3 rounded-xl transition-all ${layoutMode === 'grid4' ? 'bg-brand-heaven-gold text-white shadow-glow' : 'text-brand-heaven-gold hover:bg-white/5 dark:hover:bg-black/5'}`}
                      title="4 Column Grid"
                    >
                      <LayoutGrid size={20} />
                    </button>
                  </div>

                  <div className="w-[1px] h-8 bg-white/10 dark:bg-black/10 mx-2" />

                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl font-avenir-bold text-[10px] uppercase tracking-[3px] transition-all active:scale-95 ${filterCountryCode !== 'ALL' || filterMinistry !== 'ALL' || filterRole !== 'ALL' || filterLetter !== 'ALL'
                      ? 'bg-brand-heaven-gold text-white shadow-glow'
                      : 'bg-white/5 dark:bg-black/5 text-brand-heaven-gold border border-brand-heaven-gold/20'
                      }`}
                  >
                    <Filter size={14} />
                    <span>Filtros</span>
                    {(filterCountryCode !== 'ALL' || filterMinistry !== 'ALL' || filterRole !== 'ALL' || filterLetter !== 'ALL') && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-glow animate-pulse" />
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Alphabet Scroll */}
              <div className="py-2 mb-4">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-2 px-1">
                  <button
                    onClick={() => setFilterLetter('ALL')}
                    className={`h-10 px-6 shrink-0 flex items-center justify-center text-[10px] font-avenir-bold tracking-[2px] rounded-full border transition-all ${filterLetter === 'ALL' ? 'bg-brand-heaven-gold text-white border-brand-heaven-gold shadow-glow' : 'text-white/40 dark:text-black/40 border-white/10 dark:border-black/5 hover:border-brand-heaven-gold/50'}`}
                  >
                    ALL NODES
                  </button>
                  {ALPHABET_GROUPS.LATIN.map(char => {
                    const isAvailable = availableLetters.has(char);
                    return (
                      <button
                        key={char}
                        onClick={() => setFilterLetter(char)}
                        disabled={!isAvailable}
                        className={`w-10 h-10 shrink-0 flex items-center justify-center text-[11px] font-avenir-bold rounded-full transition-all ${filterLetter === char
                          ? 'bg-white dark:bg-black text-black dark:text-white shadow-glow-sm'
                          : isAvailable
                            ? 'text-white/60 dark:text-black/60 hover:bg-white/10 dark:hover:bg-black/10 hover:text-white dark:hover:text-black border border-white/5'
                            : 'text-white/10 dark:text-black/10 cursor-not-allowed border border-transparent'
                          }`}
                      >
                        {char}
                      </button>
                    );
                  })}
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
          <div className="flex flex-col">
            {/* Results Grid - Dynamic Columns */}
            <div className={`grid gap-6 md:gap-10 ${layoutMode === 'grid4' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
              layoutMode === 'grid2' ? 'grid-cols-1 sm:grid-cols-2' :
                'grid-cols-1'
              }`}>
              {filteredParticipants.map(p => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  onClick={() => setSelectedParticipant(p)}
                  layout={layoutMode === 'list' ? 'list' : 'grid'}
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'admin' ? (
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
        ) : (
          <RegistrationForm />
        )}
      </main>

      <footer className="mt-40 border-t border-white/5 dark:border-black/5 py-32 bg-black dark:bg-white text-center">
        <div className="max-w-[1400px] mx-auto px-8 space-y-10">
          <p className="font-didot italic text-3xl text-white/30 dark:text-black/20 max-w-3xl mx-auto leading-relaxed">
            "TOGETHER FOR 100 MILLION LIVES FOR JESUS CHRIST"
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

      {/* Professional Filter Drawer */}
      <div
        className={`fixed inset-0 z-[200] transition-all duration-500 ${isFilterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-[#0a0a0a] dark:bg-white shadow-2xl border-l border-white/10 dark:border-black/5 flex flex-col transition-transform duration-500 ease-out ${isFilterDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 border-b border-white/10 dark:border-black/5 flex justify-between items-center bg-white/5 dark:bg-black/5">
            <h3 className="text-xs font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px]">Filtros Avançados</h3>
            <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 text-white/40 dark:text-black/40 hover:text-brand-heaven-gold transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            <div className="space-y-6">
              <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2 tracking-[2px]">
                <Globe size={14} /> Geographic Hub
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCountryCode('ALL')}
                  className={`px-4 py-2 text-[10px] font-avenir-bold uppercase tracking-widest rounded-xl border transition-all ${filterCountryCode === 'ALL' ? 'bg-brand-heaven-gold text-white border-brand-heaven-gold shadow-glow' : 'border-white/10 dark:border-black/10 text-white/40 dark:text-black/40 hover:border-brand-heaven-gold/50'}`}
                >
                  Global
                </button>
                {activeCountries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setFilterCountryCode(c.code)}
                    className={`px-4 py-2 text-[10px] font-avenir-bold uppercase rounded-xl border transition-all ${filterCountryCode === c.code ? 'bg-white dark:bg-black text-black dark:text-white border-white dark:border-black shadow-lg' : 'border-white/10 dark:border-black/10 text-white/40 dark:text-black/40 hover:border-brand-heaven-gold/50'}`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2 tracking-[2px]">
                <Building size={14} /> Ministry / Organization
              </span>
              <select
                value={filterMinistry}
                onChange={e => setFilterMinistry(e.target.value)}
                className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-2xl text-xs font-avenir-medium text-white dark:text-black outline-none focus:border-brand-heaven-gold"
              >
                <option value="ALL">All Organizations</option>
                {uniqueMinistries.map(m => <option key={m} value={m} className="bg-[#0a0a0a] dark:bg-white">{m}</option>)}
              </select>
            </div>

            <div className="space-y-6">
              <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2 tracking-[2px]">
                <Briefcase size={14} /> Leadership Capacity
              </span>
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="w-full bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 p-4 rounded-2xl text-xs font-avenir-medium text-white dark:text-black outline-none focus:border-brand-heaven-gold"
              >
                <option value="ALL">All Leadership Roles</option>
                {uniqueRoles.map(r => <option key={r} value={r} className="bg-[#0a0a0a] dark:bg-white">{r}</option>)}
              </select>
            </div>
          </div>

          <div className="p-8 border-t border-white/10 dark:border-black/5 bg-white/5 dark:bg-black/5 space-y-4">
            <button
              onClick={() => {
                setFilterCountryCode('ALL');
                setFilterMinistry('ALL');
                setFilterRole('ALL');
                setFilterLetter('ALL');
                setSearchQuery('');
              }}
              className="w-full py-4 text-[10px] font-avenir-bold text-white/40 dark:text-black/40 uppercase tracking-[3px] hover:text-brand-heaven-gold transition-colors"
            >
              Limpar Todos os Filtros
            </button>
            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full py-5 bg-brand-heaven-gold text-white font-avenir-bold uppercase text-[10px] tracking-[4px] rounded-2xl shadow-glow active:scale-95 transition-all"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
};

export default App;
