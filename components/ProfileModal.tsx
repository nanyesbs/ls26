
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 dark:bg-white/95 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] bg-black dark:bg-white border border-white/10 dark:border-stone-200 overflow-hidden flex flex-col rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-colors duration-500">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] w-10 h-10 flex items-center justify-center bg-black/20 dark:bg-black/5 backdrop-blur-xl rounded-full text-white/80 dark:text-stone-500 hover:text-brand-heaven-gold transition-all active:scale-95 group"
        >
          <X size={20} className="transition-transform group-hover:rotate-90" />
        </button>

        <div className="flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden">
          {/* Visual Column - Refined 30% */}
          <div className="w-full md:w-[32%] bg-stone-900/50 dark:bg-stone-50/50 flex flex-col flex-shrink-0 border-b md:border-b-0 md:border-r border-white/5 dark:border-stone-100 p-6 md:p-8 md:overflow-y-auto custom-scrollbar md:h-full">

            {/* Profile Frame */}
            <div className="relative w-full aspect-square md:aspect-[4/5] rounded-xl overflow-hidden border border-white/10 dark:border-stone-200 shadow-xl mb-6">
              <img
                src={participant.photoUrl || getIdentityPlaceholder(participant.name)}
                alt={participant.name}
                onError={handleImageError}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Promo Frame (Optional) */}
            {participant.promoPhotoUrl && (
              <div className="space-y-3 group/promo">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] opacity-60">Promotional Intelligence</span>
                  <a
                    href={participant.promoPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] font-avenir-bold text-brand-heaven-gold/40 hover:text-brand-heaven-gold uppercase tracking-widest flex items-center gap-1 transition-all"
                  >
                    <Maximize2 size={10} /> Ampliar
                  </a>
                </div>
                <div
                  className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 dark:border-stone-200/50 shadow-lg bg-black/20 cursor-zoom-in"
                  onClick={() => window.open(participant.promoPhotoUrl, '_blank')}
                >
                  <img
                    src={participant.promoPhotoUrl}
                    alt="Promotion"
                    className="w-full h-full object-cover opacity-80 group-hover/promo:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/promo:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                    <Maximize2 size={24} className="text-white/50" />
                  </div>
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div className="mt-auto pt-8 flex items-center justify-center gap-3 opacity-40">
              <Shield size={12} className="text-brand-heaven-gold" />
              <span className="text-[8px] font-avenir-bold text-white dark:text-black uppercase tracking-[2px]">Encrypted Stuttgart Node</span>
            </div>
          </div>

          {/* Intelligence Column - 68% */}
          <div className="w-full md:w-[68%] flex-1 flex flex-col bg-black dark:bg-white md:overflow-hidden">
            <div className="flex-1 md:overflow-y-auto custom-scrollbar px-6 py-10 md:px-12 md:py-12">

              {/* Header: Identity Core */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1 bg-white/5 dark:bg-stone-50 rounded-full border border-white/5 dark:border-stone-200 flex items-center gap-2">
                    <span className="text-sm">{participant.country.flag}</span>
                    <span className="text-[9px] font-avenir-bold text-white/60 dark:text-black/60 uppercase tracking-widest">{participant.country.name} Node</span>
                  </div>
                  {participant.nationality.code !== participant.country.code && (
                    <div className="px-3 py-1 bg-white/5 dark:bg-stone-100 rounded-full border border-white/5 dark:border-stone-200 flex items-center gap-2">
                      <span className="text-sm">{participant.nationality.flag}</span>
                      <span className="text-[9px] font-avenir-bold text-white/40 dark:text-black/40 uppercase tracking-widest">Heritage</span>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl md:text-4xl font-extrabold text-white dark:text-black leading-none mb-3 uppercase tracking-tighter">
                  {participant.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm md:text-lg font-didot italic text-brand-heaven-gold">{participant.title}</p>
                  <div className="w-1 h-1 rounded-full bg-brand-heaven-gold/30" />
                  <p className="text-[10px] md:text-xs font-avenir-bold text-white/50 dark:text-stone-400 uppercase tracking-widest">{participant.organization}</p>
                </div>
              </div>

              {/* Data Blocks */}
              <div className="grid grid-cols-1 gap-10">

                {/* Identity Summary: Short Bio */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px] flex items-center gap-2">
                    <User size={14} /> Executive Summary
                  </h4>
                  <p className="text-sm md:text-base font-avenir-roman leading-relaxed text-white/90 dark:text-black/80">
                    {participant.shortBio || participant.testimony.substring(0, 150) + "..."}
                  </p>
                </div>

                {/* Communication Hub: Public Access */}
                <div className="bg-white/5 dark:bg-stone-50 p-6 rounded-2xl border border-white/5 dark:border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/50 uppercase tracking-widest">Secure Wire</span>
                    <a href={`tel:${participant.phone}`} className="text-xs font-avenir-medium text-white dark:text-black hover:text-brand-heaven-gold flex items-center gap-2">
                      <Phone size={12} className="opacity-40" /> {participant.phone || 'Communication Pending'}
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/50 uppercase tracking-widest">Direct Packet</span>
                    <a href={`mailto:${participant.email}`} className="text-xs font-avenir-medium text-white dark:text-black hover:text-brand-heaven-gold flex items-center gap-2 truncate">
                      <Mail size={12} className="opacity-40" /> {participant.email}
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/50 uppercase tracking-widest">Digital Nexus</span>
                    {participant.website ? (
                      <a href={participant.website.startsWith('http') ? participant.website : `https://${participant.website}`} target="_blank" rel="noopener noreferrer" className="text-xs font-avenir-medium text-white dark:text-black hover:text-brand-heaven-gold flex items-center gap-2">
                        <Globe size={12} className="opacity-40" /> {participant.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-[10px] italic text-white/20">No Website Linked</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/50 uppercase tracking-widest">Other Channels</span>
                    <p className="text-xs font-avenir-medium text-white dark:text-black flex items-center gap-2">
                      <Info size={12} className="opacity-40" /> {participant.otherInfo || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Spiritual Journey / Testimony */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px] flex items-center gap-2">
                    <Sparkles size={14} /> Spiritual Journey
                  </h4>
                  <p className="text-[13px] md:text-[15px] font-avenir-roman leading-relaxed text-white/70 dark:text-stone-600 first-letter:text-3xl first-letter:font-didot first-letter:mr-2 first-letter:float-left first-letter:text-brand-heaven-gold">
                    {participant.testimony}
                  </p>
                </div>

                {/* Legacy & Vision */}
                {participant.orgDescription && (
                  <div className="p-8 bg-brand-heaven-gold/5 border-l-4 border-brand-heaven-gold rounded-r-2xl">
                    <h4 className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] mb-3 flex items-center gap-2">
                      <Building2 size={12} /> Organizational Vision
                    </h4>
                    <p className="text-[14px] italic font-avenir-roman text-white/80 dark:text-black/80 leading-relaxed">
                      "{participant.orgDescription}"
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Secure Overlay (Only for authorized) */}
              {isAdmin && (
                <div className="mt-16 pt-8 border-t border-white/10 dark:border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield size={14} className="text-red-500" />
                    <span className="text-[9px] font-avenir-bold uppercase text-red-500 tracking-[3px]">Admin Controls Enabled</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => onEdit?.(participant.id)} className="px-6 py-2 bg-brand-heaven-gold/20 hover:bg-brand-heaven-gold text-brand-heaven-gold hover:text-white border border-brand-heaven-gold/30 rounded-lg text-[10px] font-avenir-bold uppercase transition-all">Edit Node</button>
                    <button onClick={() => onDelete?.(participant.id)} className="px-6 py-2 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/30 rounded-lg text-[10px] font-avenir-bold uppercase transition-all">Terminate ID</button>
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
