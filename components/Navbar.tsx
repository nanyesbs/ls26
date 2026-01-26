import React from 'react';
import { LayoutGrid, ShieldCheck, Moon, Sun, PlusCircle } from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    isAdminAuthorized: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
    viewMode,
    setViewMode,
    darkMode,
    setDarkMode,
    isAdminAuthorized
}) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/80 dark:bg-white/80 backdrop-blur-xl border-b border-white/10 dark:border-black/5 px-4 md:px-8 py-4">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-auto">
                        <img
                            src={darkMode ? "/logo-dark.png" : "/logo-light.png"}
                            alt="Leaders' Summit 2026 Logo"
                            className="h-full w-auto object-contain"
                        />
                    </div>
                    <span className="text-[10px] font-avenir-bold text-white dark:text-black uppercase tracking-[0.3em] hidden sm:block">
                        Leaders' Summit 2026
                    </span>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setViewMode('directory')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${viewMode === 'directory' ? 'text-brand-heaven-gold' : 'text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black'}`}
                        >
                            <LayoutGrid size={14} /> Directory
                        </button>
                        <button
                            onClick={() => setViewMode('admin')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all ${viewMode === 'admin' ? 'text-brand-heaven-gold' : 'text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black'}`}
                        >
                            <ShieldCheck size={14} /> Admin {isAdminAuthorized && <span className="w-1 h-1 rounded-full bg-green-500" />}
                        </button>
                        <button
                            onClick={() => setViewMode('registration')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 px-4 py-1.5 rounded-button border transition-all ${viewMode === 'registration' ? 'bg-brand-heaven-gold border-brand-heaven-gold text-white shadow-glow-sm' : 'border-white/10 dark:border-black/10 text-brand-heaven-gold hover:bg-brand-heaven-gold/10'}`}
                        >
                            <PlusCircle size={14} /> New Bio
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-white/10 dark:bg-black/10 mx-2" />

                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="text-brand-heaven-gold hover:scale-110 active:scale-95 transition-all"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
