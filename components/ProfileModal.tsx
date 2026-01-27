
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
      className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 md:p-10 bg-black/90 dark:bg-white/95 backdrop-blur-2xl animate-fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl md:max-h-[90vh] bg-[#0a0a0a] dark:bg-white border border-white/10 dark:border-stone-200 md:overflow-hidden flex flex-col rounded-3xl md:rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] transition-colors duration-500 overflow-hidden">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-[120] w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-2xl rounded-full text-white/80 hover:text-brand-heaven-gold hover:scale-110 hover:rotate-90 transition-all active:scale-95 group border border-white/10"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col md:flex-row w-full md:h-full md:overflow-hidden">
          {/* Mobile Profile Header (Creative Approach) */}
          <div className="md:hidden relative w-full aspect-[4/3] min-h-[250px] flex-shrink-0">
            {/* Banner Background */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={participant.promoPhotoUrl || participant.photoUrl || getIdentityPlaceholder(participant.name)}
                className="w-full h-full object-cover blur-sm brightness-50 scale-110"
                alt="Banner"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20" />
            </div>

            {/* Profile Info Overlap */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end gap-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-heaven-gold to-white/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-brand-heaven-gold/30 shadow-2xl">
                  <img
                    src={participant.photoUrl || getIdentityPlaceholder(participant.name)}
                    className="w-full h-full object-cover"
                    alt={participant.name}
                  />
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="px-2 py-1 bg-brand-heaven-gold/20 backdrop-blur-md rounded-lg border border-brand-heaven-gold/30 w-fit mb-2">
                  <p className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px] flex items-center gap-1">
                    {participant.country.flag} {participant.country.name} Node
                  </p>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
                  {participant.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Desktop Visual Column (Left Area) */}
          <div className="hidden md:flex w-full md:w-[35%] bg-stone-900/50 dark:bg-stone-50/50 flex flex-col flex-shrink-0 border-r border-white/5 dark:border-stone-100 p-8 md:overflow-y-auto custom-scrollbar h-full">
            {/* Profile Frame */}
            <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 dark:border-stone-200 shadow-2xl mb-8 group">
              <img
                src={participant.photoUrl || getIdentityPlaceholder(participant.name)}
                alt={participant.name}
                onError={handleImageError}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px] mb-2">{participant.country.name} Host Node</p>
                <div className="w-12 h-[1px] bg-brand-heaven-gold" />
              </div>
            </div>

            {/* Promo Frame */}
            {participant.promoPhotoUrl && (
              <div className="space-y-4 group/promo">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] opacity-60 flex items-center gap-2">
                    <Sparkles size={12} /> Visual Intelligence
                  </span>
                </div>
                <div
                  className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/5 dark:border-stone-200 shadow-lg bg-black/40 cursor-zoom-in group-hover/promo:border-brand-heaven-gold/30 transition-all"
                  onClick={() => window.open(participant.promoPhotoUrl, '_blank')}
                >
                  <img
                    src={participant.promoPhotoUrl}
                    alt="Promotion"
                    className="w-full h-full object-cover opacity-60 group-hover/promo:opacity-100 group-hover/promo:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/promo:opacity-100 transition-opacity bg-black/40 backdrop-blur-[4px]">
                    <div className="flex flex-col items-center gap-2">
                      <Maximize2 size={32} className="text-white/70" />
                      <span className="text-[10px] font-avenir-bold text-white uppercase tracking-widest">Expand Vision</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto pt-10 flex flex-col items-center gap-4 opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border border-brand-heaven-gold/40 flex items-center justify-center">
                  <Shield size={14} className="text-brand-heaven-gold" />
                </div>
                <span className="text-[9px] font-avenir-bold text-white dark:text-black uppercase tracking-[3px]">Secure Stuttgart Node</span>
              </div>
              <p className="text-[8px] font-avenir-roman text-center max-w-[150px] leading-relaxed">IDENTITY VERIFIED • ACCESS GRANTED SUMMIT 2026</p>
            </div>
          </div>

          {/* Info Column (Right Area) - Expanded & Refined */}
          <div className="w-full md:w-[65%] flex-1 flex flex-col bg-[#0a0a0a] dark:bg-white md:overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 md:px-16 md:py-16 space-y-12 md:space-y-16">

              {/* Header Info (Desktop Only) */}
              <div className="hidden md:block">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-brand-heaven-gold/5 dark:bg-stone-50 rounded-full border border-brand-heaven-gold/20 flex items-center gap-3">
                      <span className="text-xl leading-none">{participant.country.flag}</span>
                      <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px]">{participant.country.name} Node</span>
                    </div>
                  </div>
                  {participant.nationality.code !== participant.country.code && (
                    <div className="px-4 py-1.5 bg-white/5 dark:bg-stone-100 rounded-full border border-white/5 dark:border-stone-200 flex items-center gap-3">
                      <span className="text-xl leading-none">{participant.nationality.flag}</span>
                      <span className="text-[10px] font-avenir-bold text-white/40 dark:text-black/40 uppercase tracking-[2px]">Heritage</span>
                    </div>
                  )}
                </div>

                <h2 className="text-5xl lg:text-7xl font-extrabold text-white dark:text-black leading-[0.9] mb-8 uppercase tracking-tighter">
                  {participant.name}
                </h2>

                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[3px] mb-1">Assignment</span>
                    <p className="text-xl lg:text-2xl font-didot italic text-brand-heaven-gold leading-none">{participant.title}</p>
                  </div>
                  <div className="w-[1px] h-10 bg-white/10 hidden lg:block" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-avenir-bold text-white/20 dark:text-black/20 uppercase tracking-[3px] mb-1">Organization</span>
                    <p className="text-xs lg:text-sm font-avenir-bold text-white/60 dark:text-stone-400 uppercase tracking-widest">{participant.organization}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Info (Mobile Only) */}
              <div className="md:hidden space-y-4">
                <div className="flex flex-col">
                  <p className="text-lg font-didot italic text-brand-heaven-gold mb-1">{participant.title}</p>
                  <p className="text-[11px] font-avenir-bold text-white/50 dark:text-stone-400 uppercase tracking-widest leading-relaxed">
                    {participant.organization}
                    {participant.nationality.code !== participant.country.code && (
                      <span className="ml-2 pl-2 border-l border-white/10 uppercase tracking-widest opacity-60">
                        Heritage: {participant.nationality.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="grid grid-cols-1 gap-16">
                {/* Bio / Testimony Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-heaven-gold/5 flex items-center justify-center border border-brand-heaven-gold/20">
                      <Sparkles size={20} className="text-brand-heaven-gold" />
                    </div>
                    <h4 className="text-[11px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[5px]">Short Bio</h4>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-[1px] bg-gradient-to-b from-brand-heaven-gold/40 via-transparent to-transparent" />
                    <p className="text-[15px] md:text-[17px] font-avenir-roman leading-relaxed text-white/80 dark:text-stone-600 first-letter:text-5xl first-letter:font-didot first-letter:mr-3 first-letter:float-left first-letter:text-brand-heaven-gold first-letter:leading-[0.7] first-letter:pt-1">
                      {participant.testimony}
                    </p>
                  </div>
                </div>

                {/* Mobile Promo Expansion (If available) */}
                {participant.promoPhotoUrl && (
                  <div className="md:hidden space-y-4">
                    <h4 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px]">Media Packet</h4>
                    <img
                      src={participant.promoPhotoUrl}
                      className="w-full rounded-2xl border border-white/10 shadow-lg"
                      alt="Promo"
                      onClick={() => window.open(participant.promoPhotoUrl, '_blank')}
                    />
                  </div>
                )}

                {/* Comms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 dark:bg-stone-100 border border-white/10 dark:border-stone-100 rounded-3xl md:rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="bg-[#0f0f0f] dark:bg-white p-5 md:p-8 flex flex-col gap-3 group transition-colors hover:bg-white/5 dark:hover:bg-stone-50">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-widest flex items-center gap-2"><Phone size={10} /> Phone Number</span>
                    <a href={`tel:${participant.phone}`} className="text-sm font-avenir-medium text-white dark:text-black group-hover:text-brand-heaven-gold transition-colors">{participant.phone || 'Communication Pend.'}</a>
                  </div>
                  <div className="bg-[#0f0f0f] dark:bg-white p-5 md:p-8 flex flex-col gap-3 group transition-colors hover:bg-white/5 dark:hover:bg-stone-50">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-widest flex items-center gap-2"><Mail size={10} /> Email Address</span>
                    <a href={`mailto:${participant.email}`} className="text-sm font-avenir-medium text-white dark:text-black group-hover:text-brand-heaven-gold transition-colors truncate">{participant.email}</a>
                  </div>
                  <div className="bg-[#0f0f0f] dark:bg-white p-5 md:p-8 flex flex-col gap-3 group transition-colors hover:bg-white/5 dark:hover:bg-stone-50">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-widest flex items-center gap-2"><Globe size={10} /> Website</span>
                    {participant.website ? (
                      <a href={participant.website.startsWith('http') ? participant.website : `https://${participant.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-avenir-medium text-white dark:text-black group-hover:text-brand-heaven-gold transition-colors">
                        {participant.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : <span className="text-xs italic opacity-20">Offline</span>}
                  </div>
                  <div className="bg-[#0f0f0f] dark:bg-white p-5 md:p-8 flex flex-col gap-3 group transition-colors hover:bg-white/5 dark:hover:bg-stone-50">
                    <span className="text-[8px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-widest flex items-center gap-2"><Info size={10} /> Other</span>
                    <p className="text-sm font-avenir-medium text-white dark:text-black">{participant.otherInfo || 'Standard Node'}</p>
                  </div>
                </div>

                {/* Detailed Org Section */}
                {participant.orgDescription && (
                  <div className="space-y-6 relative">
                    <div className="absolute -left-16 right-0 h-px bg-white/5" />
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Building2 size={20} className="text-brand-heaven-gold" />
                      </div>
                      <h4 className="text-[11px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[5px]">organization description</h4>
                    </div>
                    <p className="text-[14px] md:text-[16px] font-avenir-roman leading-relaxed text-white/90 dark:text-black/80 p-8 bg-white/[0.02] dark:bg-stone-50 rounded-3xl border border-white/5">
                      {participant.orgDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Secure Overlay */}
              {isAdmin && (
                <div className="mt-20 pt-10 border-t border-white/10 dark:border-black/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 py-2 px-4 bg-red-500/5 rounded-full border border-red-500/10">
                    <Shield size={16} className="text-red-500 animate-pulse" />
                    <span className="text-[10px] font-avenir-bold uppercase text-red-500 tracking-[4px]">Tactical Controls Active</span>
                  </div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={() => onEdit?.(participant.id)} className="flex-1 sm:flex-initial px-8 py-3 bg-brand-heaven-gold/10 hover:bg-brand-heaven-gold text-brand-heaven-gold hover:text-white border border-brand-heaven-gold/30 rounded-xl text-[10px] font-avenir-bold uppercase transition-all shadow-glow-hover">Edit Identity</button>
                    <button onClick={() => onDelete?.(participant.id)} className="flex-1 sm:flex-initial px-8 py-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/30 rounded-xl text-[10px] font-avenir-bold uppercase transition-all">Deactivate Node</button>
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
