
import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { X, Mail, Globe, Phone, User, Sparkles, Shield, Building2, Info, PlusCircle, Maximize2 } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER } from '../constants';

interface ProfileModalProps {
  participant: Participant | null;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ participant, onClose, isAdmin, onEdit, onDelete }) => {
  const [isShowingPromo, setIsShowingPromo] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [fallbackStage, setFallbackStage] = useState<number>(0);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (participant) {
      const initialUrl = isShowingPromo && participant.promoPhotoUrl ? participant.promoPhotoUrl : participant.photoUrl;
      setImgSrc(initialUrl || getIdentityPlaceholder(participant.name));
      setFallbackStage(initialUrl ? 0 : 1);
    }
  }, [participant, isShowingPromo]);

  if (!participant) return null;

  const handleImageError = () => {
    if (fallbackStage === 0) {
      setImgSrc(getIdentityPlaceholder(participant.name));
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setImgSrc(HIGH_QUALITY_PLACEHOLDER);
      setFallbackStage(2);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 dark:bg-white/90 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl bg-[#0a0a0a] dark:bg-white border border-white/5 dark:border-stone-200 overflow-hidden flex flex-col md:flex-row rounded-modal shadow-modal transition-colors duration-500">

        <button
          onClick={onClose}
          className="fixed top-6 right-6 md:absolute md:top-8 md:right-8 z-[110] w-12 h-12 flex items-center justify-center bg-black/40 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-full text-white/90 md:text-white/40 dark:text-stone-400 dark:md:text-stone-300 hover:text-brand-heaven-gold dark:hover:text-brand-heaven-gold transition-all shadow-xl md:shadow-none active:scale-95 group"
        >
          <X size={28} className="transition-transform group-hover:rotate-90" />
        </button>

        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Bio Image View - Mobile: Contained Photo, Desktop: Full Height */}
          <div className="relative w-full md:w-[45%] bg-gradient-to-b from-black via-black to-[#0a0a0a] dark:from-stone-100 dark:via-stone-100 dark:to-white flex flex-col items-center justify-center shrink-0 py-6 md:py-0">
            <div className="relative w-full max-w-[280px] md:max-w-none md:w-full aspect-square md:aspect-auto md:h-full overflow-hidden">
              <img
                key={imgSrc}
                src={imgSrc}
                alt={participant.name}
                onError={handleImageError}
                className={`w-full h-full transition-all duration-700 ${isShowingPromo
                  ? 'object-contain bg-black/20 dark:bg-stone-200/50 p-2 md:p-4'
                  : 'object-contain md:object-cover brightness-90 dark:brightness-100'
                  } ${isShowingPromo ? 'scale-100' : 'scale-100'}`}
              />
              {/* Desktop Gradient Overlay - Only for profile photo */}
              {!isShowingPromo && (
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 dark:from-white/40 via-transparent to-transparent pointer-events-none" />
              )}

              {/* Mobile Profile Photo Controls */}
              {participant.promoPhotoUrl && (
                <div className="md:hidden absolute bottom-4 right-4 z-30">
                  <button
                    onClick={() => {
                      setIsShowingPromo(!isShowingPromo);
                      setFallbackStage(0);
                    }}
                    className="w-10 h-10 bg-brand-heaven-gold/20 backdrop-blur-xl border border-brand-heaven-gold/40 rounded-full flex items-center justify-center text-brand-heaven-gold shadow-glow transition-all active:scale-90"
                  >
                    {isShowingPromo ? <User size={16} /> : <Sparkles size={16} />}
                  </button>
                </div>
              )}

              {/* Promo Full View Toggle (Desktop/Mobile) */}
              {isShowingPromo && (
                <div className="absolute top-4 left-4 z-30">
                  <a
                    href={imgSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all active:scale-90"
                    title="Open Full Size"
                  >
                    <Maximize2 size={16} />
                  </a>
                </div>
              )}
            </div>

            {/* Desktop Promo Button */}
            {participant.promoPhotoUrl && (
              <div className="hidden md:block absolute bottom-6 left-0 w-full px-6 z-20">
                <button
                  onClick={() => {
                    setIsShowingPromo(!isShowingPromo);
                    setFallbackStage(0);
                  }}
                  className="w-full py-4 min-h-[44px] bg-brand-heaven-gold/10 backdrop-blur-xl border border-brand-heaven-gold/30 rounded-button text-brand-heaven-gold text-xs md:text-sm font-avenir-bold uppercase flex items-center justify-center gap-3 transition-all hover:bg-brand-heaven-gold hover:text-white group"
                >
                  {isShowingPromo ? <User size={14} /> : <Sparkles size={14} className="group-hover:animate-spin" />}
                  <span>{isShowingPromo ? 'View Identity Profile' : 'View Promotional Asset'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Bio Text Content */}
          <div className="w-full md:w-[55%] px-4 py-6 sm:p-8 md:p-14 lg:p-16 flex flex-col bg-[#0a0a0a] dark:bg-white overflow-y-auto max-h-[60vh] md:max-h-none custom-scrollbar">

            {/* Flags / Nodes - Compact on mobile */}
            <div className="mb-6 md:mb-12 flex flex-wrap gap-3 sm:gap-8">
              <div className="flex items-center gap-2 md:gap-4">
                <span className="text-xl md:text-3xl filter drop-shadow-md">{participant.country.flag}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs font-avenir-bold text-brand-heaven-gold uppercase tracking-[1px] md:tracking-[2px]">Resident</span>
                  <span className="text-xs md:text-sm font-avenir-medium text-white dark:text-black uppercase">{participant.country.name}</span>
                </div>
              </div>

              {participant.country.code !== participant.nationality.code && (
                <div className="flex items-center gap-2 md:gap-4 border-l border-white/10 dark:border-stone-200 pl-3 sm:pl-8">
                  <span className="text-xl md:text-3xl filter drop-shadow-md">{participant.nationality.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-avenir-bold text-brand-heaven-gold uppercase tracking-[1px] md:tracking-[2px]">Heritage</span>
                    <span className="text-xs md:text-sm font-avenir-medium text-white dark:text-black uppercase">{participant.nationality.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 md:mb-10">
              <h2 className="text-xl sm:text-2xl md:text-5xl lg:text-6xl font-extrabold text-white dark:text-black leading-[1.1] mb-2 md:mb-6 uppercase tracking-tighter">
                {participant.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1 sm:gap-3">
                <p className="text-xs sm:text-sm md:text-xl font-didot italic text-brand-heaven-gold">{participant.title}</p>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-brand-heaven-gold opacity-30" />
                <p className="text-[10px] md:text-sm font-avenir-bold text-white/40 dark:text-stone-400 uppercase tracking-wider">{participant.organization}</p>
              </div>
            </div>

            <div className="w-10 md:w-20 h-[1px] bg-brand-heaven-gold mb-4 md:mb-12" />

            {/* Public Narrative */}
            <div className="space-y-6 md:space-y-10 mb-8 md:mb-16">
              <div className="relative">
                <p className="text-sm md:text-lg font-avenir-roman leading-relaxed text-white/90 dark:text-black/80 first-letter:text-3xl md:first-letter:text-5xl first-letter:font-didot first-letter:mr-2 md:first-letter:mr-3 first-letter:float-left first-letter:text-brand-heaven-gold">
                  {participant.testimony || "Identity manifestation in progress for the Leaders' Summit 2026."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {participant.orgDescription && (
                  <div className="bg-white/5 dark:bg-stone-50 p-6 rounded-card border-l-4 border-brand-heaven-gold">
                    <h5 className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px] mb-3 flex items-center gap-2">
                      <Building2 size={12} /> Organizational Vision
                    </h5>
                    <p className="text-[14px] font-avenir-roman text-white/70 dark:text-black/70 italic">
                      "{participant.orgDescription}"
                    </p>
                  </div>
                )}

                {participant.otherInfo && (
                  <div className="bg-white/5 dark:bg-stone-50 p-6 rounded-card">
                    <h5 className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px] mb-3 flex items-center gap-2">
                      <Info size={12} /> Additional Intelligence
                    </h5>
                    <p className="text-[14px] font-avenir-roman text-white/70 dark:text-black/70">
                      {participant.otherInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Public Access Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-white/5 dark:border-stone-100 pt-10 mt-auto">
              <div className="flex flex-col">
                <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest mb-2">Digital Presence</span>
                {participant.website ? (
                  <a href={participant.website.startsWith('http') ? participant.website : `https://${participant.website}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-avenir-medium text-white dark:text-black hover:text-brand-heaven-gold transition-colors flex items-center gap-2">
                    <Globe size={14} /> {participant.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <span className="text-[14px] font-avenir-roman text-white/40 dark:text-stone-400 italic">No URL Linked</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest mb-2">Primary Node</span>
                <div className="text-[14px] font-avenir-medium text-white dark:text-black flex items-center gap-2">
                  <Building2 size={14} /> {participant.organization}
                </div>
              </div>
            </div>

            {/* Admin Controls Area */}
            {isAdmin && (
              <div className="mt-16 p-6 sm:p-8 bg-brand-heaven-gold/5 border border-brand-heaven-gold/20 rounded-button animate-fade-in mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <h4 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] flex items-center gap-2">
                    <Shield size={14} /> Admin Secure Access
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit?.(participant.id)} className="flex-1 sm:flex-none px-6 py-4 min-h-[44px] bg-brand-heaven-gold text-white rounded-button text-xs md:text-sm font-avenir-bold uppercase transition-all hover:brightness-110 shadow-md active:scale-95">Edit Node</button>
                    <button onClick={() => onDelete?.(participant.id)} className="flex-1 sm:flex-none px-6 py-4 min-h-[44px] bg-red-500 text-white rounded-button text-xs md:text-sm font-avenir-bold uppercase hover:brightness-110 transition-all shadow-md active:scale-95">Delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 opacity-80">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-avenir-bold uppercase text-brand-heaven-gold mb-1">Secure Email</span>
                    <a href={`mailto:${participant.email}`} className="text-[11px] md:text-[12px] font-mono text-white dark:text-black hover:underline break-all">{participant.email || 'None'}</a>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-avenir-bold uppercase text-brand-heaven-gold mb-1">Direct Line</span>
                    <a href={`tel:${participant.phone}`} className="text-[11px] md:text-[12px] font-mono text-white dark:text-black hover:underline">{participant.phone || 'None'}</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
