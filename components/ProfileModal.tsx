
import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { X, Mail, Globe, Phone, User, Sparkles, Shield, Building2, Info, Maximize2 } from 'lucide-react';
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/85 dark:bg-white/95 backdrop-blur-xl animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-6xl h-auto max-h-[90vh] bg-black dark:bg-white border border-white/10 dark:border-stone-200 overflow-hidden flex flex-col md:flex-row rounded-[2.5rem] shadow-2xl transition-colors duration-500">

        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-8 md:right-8 z-[110] w-12 h-12 flex items-center justify-center bg-black/20 dark:bg-black/5 backdrop-blur-xl rounded-full text-white/80 dark:text-stone-500 hover:text-brand-heaven-gold dark:hover:text-brand-heaven-gold transition-all active:scale-95 group"
        >
          <X size={24} className="transition-transform group-hover:rotate-90" />
        </button>

        <div className="flex flex-col md:flex-row w-full h-full min-h-0">
          {/* Bio Image View - Professional 40% Split */}
          <div className="relative w-full md:w-[40%] bg-stone-900 dark:bg-stone-50 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/5 dark:border-stone-100 group">
            <div className="relative w-full aspect-square md:aspect-auto md:h-full overflow-hidden flex items-center justify-center bg-black/40">
              <img
                key={imgSrc}
                src={imgSrc}
                alt={participant.name}
                onError={handleImageError}
                className={`w-full h-full transition-all duration-1000 ease-in-out ${isShowingPromo
                  ? 'object-contain p-4 md:p-8 hover:scale-105'
                  : 'object-cover brightness-[0.85] dark:brightness-100 hover:scale-105'
                  }`}
              />

              {!isShowingPromo && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-white/10 via-transparent to-transparent pointer-events-none" />
              )}
            </div>

            {/* Desktop Promo Button Overlay */}
            {participant.promoPhotoUrl && (
              <div className="absolute bottom-6 left-0 w-full px-6 z-20">
                <button
                  onClick={() => {
                    setIsShowingPromo(!isShowingPromo);
                    setFallbackStage(0);
                  }}
                  className="w-full py-4 bg-black/60 dark:bg-white/60 backdrop-blur-2xl border border-white/10 dark:border-stone-200/50 rounded-2xl text-white dark:text-black text-[10px] md:text-xs font-avenir-bold uppercase flex items-center justify-center gap-3 transition-all hover:bg-brand-heaven-gold hover:text-white hover:border-brand-heaven-gold group tracking-widest shadow-xl"
                >
                  {isShowingPromo ? <User size={14} /> : <Sparkles size={14} className="group-hover:animate-pulse" />}
                  <span>{isShowingPromo ? 'View Profile' : 'View Promo Asset'}</span>
                </button>
              </div>
            )}

            {isShowingPromo && (
              <div className="absolute top-6 left-6 z-30">
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

          {/* Bio Text Content - 60% Split with controlled scrolling */}
          <div className="w-full md:w-[60%] flex flex-col bg-black dark:bg-white overflow-hidden min-h-0">
            <div className="overflow-y-auto h-full custom-scrollbar px-6 py-10 sm:p-10 md:p-12 lg:p-16">

              {/* Flags Section */}
              <div className="mb-12 flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-4 bg-white/5 dark:bg-stone-50 p-3 pr-6 rounded-2xl border border-white/5 dark:border-stone-100 shadow-sm">
                  <span className="text-3xl filter drop-shadow-md">{participant.country.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px]">Resident</span>
                    <span className="text-xs font-avenir-medium text-white/90 dark:text-black/90 uppercase">{participant.country.name}</span>
                  </div>
                </div>

                {participant.country.code !== participant.nationality.code && (
                  <div className="flex items-center gap-4 bg-white/5 dark:bg-stone-50 p-3 pr-6 rounded-2xl border border-white/5 dark:border-stone-100 shadow-sm">
                    <span className="text-3xl filter drop-shadow-md">{participant.nationality.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px]">Heritage</span>
                      <span className="text-xs font-avenir-medium text-white/90 dark:text-black/90 uppercase">{participant.nationality.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 md:mb-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-white dark:text-black leading-[1.1] mb-4 md:mb-6 uppercase tracking-tighter">
                  {participant.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <p className="text-sm md:text-2xl font-didot italic text-brand-heaven-gold">{participant.title}</p>
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-brand-heaven-gold opacity-30" />
                  <p className="text-[11px] md:text-base font-avenir-bold text-white/40 dark:text-stone-400 uppercase tracking-widest">{participant.organization}</p>
                </div>
              </div>

              <div className="w-12 md:w-24 h-[2px] bg-brand-heaven-gold mb-8 md:mb-16" />

              <div className="space-y-6 md:space-y-10 mb-10 md:mb-16">
                <div className="relative">
                  <p className="text-base md:text-lg font-avenir-roman leading-relaxed text-white/90 dark:text-black/80 first-letter:text-4xl md:first-letter:text-5xl first-letter:font-didot first-letter:mr-3 md:first-letter:mr-4 first-letter:float-left first-letter:text-brand-heaven-gold">
                    {participant.testimony || "No testimony provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {participant.orgDescription && (
                    <div className="bg-white/5 dark:bg-stone-50 p-8 rounded-3xl border-l-[6px] border-brand-heaven-gold shadow-sm">
                      <h5 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] mb-4 flex items-center gap-2">
                        <Building2 size={14} /> Organizational Vision
                      </h5>
                      <p className="text-[15px] md:text-[17px] font-avenir-roman text-white/70 dark:text-black/70 italic leading-relaxed">
                        "{participant.orgDescription}"
                      </p>
                    </div>
                  )}

                  {participant.otherInfo && (
                    <div className="bg-white/5 dark:bg-stone-50 p-8 rounded-3xl border border-white/5 dark:border-stone-100 shadow-sm">
                      <h5 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] mb-4 flex items-center gap-2">
                        <Info size={14} /> Additional Intelligence
                      </h5>
                      <p className="text-[15px] md:text-[17px] font-avenir-roman text-white/70 dark:text-black/70 leading-relaxed">
                        {participant.otherInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Links and Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 border-t border-white/10 dark:border-stone-100 pt-12 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest mb-3">Digital Presence</span>
                  {participant.website ? (
                    <a href={participant.website.startsWith('http') ? participant.website : `https://${participant.website}`} target="_blank" rel="noopener noreferrer" className="text-base font-avenir-medium text-white dark:text-black hover:text-brand-heaven-gold transition-colors flex items-center gap-2 group/link">
                      <Globe size={16} className="group-hover/link:animate-spin-slow" /> {participant.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-base font-avenir-roman text-white/40 dark:text-stone-400 italic">No Website Linked</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest mb-3">Primary Node</span>
                  <div className="text-base font-avenir-medium text-white dark:text-black flex items-center gap-2">
                    <Building2 size={16} className="text-brand-heaven-gold" /> {participant.organization}
                  </div>
                </div>
              </div>

              {/* Admin Area */}
              {isAdmin && (
                <div className="mt-20 p-8 sm:p-10 bg-brand-heaven-gold/5 border border-brand-heaven-gold/20 rounded-[2rem] animate-fade-in mb-12 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10 border-b border-brand-heaven-gold/10 pb-8">
                    <h4 className="text-[11px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px] flex items-center gap-3">
                      <Shield size={16} /> Admin Secure Access
                    </h4>
                    <div className="flex gap-4">
                      <button onClick={() => onEdit?.(participant.id)} className="flex-1 sm:flex-none px-8 py-4 bg-brand-heaven-gold text-white rounded-2xl text-xs md:text-sm font-avenir-bold uppercase transition-all hover:brightness-110 shadow-lg active:scale-95">Edit</button>
                      <button onClick={() => onDelete?.(participant.id)} className="flex-1 sm:flex-none px-8 py-4 bg-red-600 text-white rounded-2xl text-xs md:text-sm font-avenir-bold uppercase hover:brightness-110 transition-all shadow-lg active:scale-95">Delete</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 opacity-90">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-avenir-bold uppercase text-brand-heaven-gold mb-2 tracking-widest">Secure Email</span>
                      <a href={`mailto:${participant.email}`} className="text-xs md:text-sm font-mono text-white dark:text-black hover:text-brand-heaven-gold transition-colors break-all underline decoration-brand-heaven-gold/30">{participant.email || 'None'}</a>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-avenir-bold uppercase text-brand-heaven-gold mb-2 tracking-widest">Direct Line</span>
                      <a href={`tel:${participant.phone}`} className="text-xs md:text-sm font-mono text-white dark:text-black hover:text-brand-heaven-gold transition-colors underline decoration-brand-heaven-gold/30">{participant.phone || 'None'}</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
