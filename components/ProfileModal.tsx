
import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { X, Mail, Globe, Phone, User, Sparkles, Shield, Building2, Info, PlusCircle } from 'lucide-react';
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
          className="fixed top-4 right-4 md:absolute md:top-6 md:right-6 z-[110] p-2 bg-black/40 md:bg-transparent backdrop-blur-md md:backdrop-blur-none rounded-full text-white/90 md:text-white/50 dark:text-stone-300 hover:text-brand-heaven-gold transition-all shadow-lg md:shadow-none"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row w-full h-full">
          {/* Bio Image View */}
          <div className="relative w-full md:w-[45%] bg-black dark:bg-stone-100 flex flex-col overflow-hidden">
            <div className="relative aspect-[3/4] md:aspect-auto md:h-full overflow-hidden max-h-[45vh] md:max-h-none">
              <img
                key={imgSrc}
                src={imgSrc}
                alt={participant.name}
                onError={handleImageError}
                className={`w-full h-full object-cover transition-all duration-1000 ${isShowingPromo ? 'scale-105' : 'scale-100 brightness-90 dark:brightness-100'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 dark:from-white/40 via-transparent to-transparent" />
            </div>

            {participant.promoPhotoUrl && (
              <div className="absolute bottom-6 left-0 w-full px-6 z-20">
                <button
                  onClick={() => {
                    setIsShowingPromo(!isShowingPromo);
                    setFallbackStage(0);
                  }}
                  className="w-full py-3.5 bg-brand-heaven-gold/10 backdrop-blur-xl border border-brand-heaven-gold/30 rounded-button text-brand-heaven-gold text-[10px] font-avenir-bold uppercase flex items-center justify-center gap-3 transition-all hover:bg-brand-heaven-gold hover:text-white group"
                >
                  {isShowingPromo ? <User size={14} /> : <Sparkles size={14} className="group-hover:animate-spin" />}
                  <span>{isShowingPromo ? 'View Identity Profile' : 'View Promotional Asset'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Bio Text Content */}
          <div className="w-full md:w-[55%] p-8 md:p-14 lg:p-16 flex flex-col bg-[#0a0a0a] dark:bg-white overflow-y-auto max-h-[85vh] custom-scrollbar">

            <div className="mb-12 flex flex-wrap gap-8">
              <div className="flex items-center gap-4">
                <span className="text-3xl filter drop-shadow-md">{participant.country.flag}</span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px]">Resident Node</span>
                  <span className="text-[12px] font-avenir-medium text-white dark:text-black uppercase">{participant.country.name}</span>
                </div>
              </div>

              {participant.country.code !== participant.nationality.code && (
                <div className="flex items-center gap-4 border-l border-white/10 dark:border-stone-200 pl-8">
                  <span className="text-3xl filter drop-shadow-md">{participant.nationality.flag}</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px]">Heritage</span>
                    <span className="text-[12px] font-avenir-medium text-white dark:text-black uppercase">{participant.nationality.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white dark:text-black leading-[1.1] mb-4 uppercase tracking-tighter">
                {participant.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <p className="text-xl font-didot italic text-brand-heaven-gold">{participant.title}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-heaven-gold opacity-30" />
                <p className="text-[12px] font-avenir-bold text-white/40 dark:text-stone-400 uppercase tracking-widest">{participant.organization}</p>
              </div>
            </div>

            <div className="w-20 h-[1.5px] bg-brand-heaven-gold mb-12" />

            {/* Public Narrative */}
            <div className="space-y-10 mb-16">
              <div className="relative">
                <p className="text-lg font-avenir-roman leading-relaxed text-white/90 dark:text-black/80 first-letter:text-5xl first-letter:font-didot first-letter:mr-3 first-letter:float-left first-letter:text-brand-heaven-gold">
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
              <div className="mt-16 p-8 bg-brand-heaven-gold/5 border border-brand-heaven-gold/20 rounded-button animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] flex items-center gap-2">
                    <Shield size={14} /> Admin Secure Access
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit?.(participant.id)} className="px-6 py-2.5 bg-brand-heaven-gold text-white rounded-button text-[10px] font-avenir-bold uppercase transition-all hover:brightness-110 shadow-md">Edit Node</button>
                    <button onClick={() => onDelete?.(participant.id)} className="px-6 py-2.5 bg-red-500 text-white rounded-button text-[10px] font-avenir-bold uppercase hover:brightness-110 transition-all shadow-md">Delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 opacity-80">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-avenir-bold uppercase text-brand-heaven-gold mb-1">Secure Email</span>
                    <a href={`mailto:${participant.email}`} className="text-[12px] font-mono text-white dark:text-black hover:underline">{participant.email || 'None'}</a>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-avenir-bold uppercase text-brand-heaven-gold mb-1">Direct Line</span>
                    <a href={`tel:${participant.phone}`} className="text-[12px] font-mono text-white dark:text-black hover:underline">{participant.phone || 'None'}</a>
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
