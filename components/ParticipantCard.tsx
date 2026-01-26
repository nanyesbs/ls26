
import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { Building2, ChevronRight } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER } from '../constants';

interface ParticipantCardProps {
  participant: Participant;
  onClick: () => void;
  layout?: 'grid' | 'list';
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onClick, layout = 'grid' }) => {
  const [imgSrc, setImgSrc] = useState<string>(participant.photoUrl || getIdentityPlaceholder(participant.name));
  const [fallbackStage, setFallbackStage] = useState<number>(participant.photoUrl ? 0 : 1);

  useEffect(() => {
    setImgSrc(participant.photoUrl || getIdentityPlaceholder(participant.name));
    setFallbackStage(participant.photoUrl ? 0 : 1);
  }, [participant.photoUrl, participant.name]);

  const handleImageError = () => {
    if (fallbackStage === 0) {
      setImgSrc(getIdentityPlaceholder(participant.name));
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setImgSrc(HIGH_QUALITY_PLACEHOLDER);
      setFallbackStage(2);
    }
  };

  const showDualFlags = participant.country.code !== participant.nationality.code;

  if (layout === 'list') {
    return (
      <div
        onClick={onClick}
        className="group relative bg-black dark:bg-[#fcfaf7] border border-white/10 dark:border-stone-200/60 hover:border-brand-heaven-gold transition-all duration-500 cursor-pointer overflow-hidden p-4 sm:p-5 flex items-center gap-6 rounded-card shadow-card hover:shadow-xl hover:-translate-y-1"
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 dark:border-stone-200/50 group-hover:border-brand-heaven-gold/50 transition-all duration-700 bg-black dark:bg-white relative shadow-inner">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out"
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-brand-heaven-gold/20 via-transparent to-transparent transition-opacity duration-700 pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-avenir-bold text-white dark:text-black mb-1 uppercase tracking-wider group-hover:text-brand-heaven-gold transition-colors line-clamp-1">
              {participant.name}
            </h3>
            <p className="text-[10px] sm:text-xs font-avenir-medium text-brand-heaven-gold uppercase tracking-[2px] opacity-90 group-hover:opacity-100 transition-opacity truncate">
              {participant.title}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden lg:flex items-center gap-2 text-xs text-white/50 dark:text-black/50 font-avenir-roman">
              <Building2 size={12} className="text-brand-heaven-gold/60 shrink-0" />
              <span className="truncate max-w-[150px]">{participant.organization}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 items-center bg-black/40 dark:bg-stone-100 p-1.5 px-3 rounded-full border border-white/10 dark:border-stone-200">
                <span className="text-lg leading-none" title="Residency">{participant.country.flag}</span>
                <span className="text-[10px] font-avenir-bold text-white/60 dark:text-black/60">{participant.country.code}</span>
              </div>
              <ChevronRight size={16} className="text-brand-heaven-gold/40 group-hover:text-brand-heaven-gold group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-black dark:bg-[#fcfaf7] border border-white/10 dark:border-stone-200/60 hover:border-brand-heaven-gold transition-all duration-700 cursor-pointer overflow-hidden p-5 md:p-6 flex flex-col items-center text-center rounded-card shadow-card hover:shadow-2xl hover:-translate-y-2"
    >
      {/* 1. Profile Picture (Coloring & Flags) */}
      <div className="relative mb-6 w-full aspect-square max-w-[180px]">
        <div className="w-full h-full rounded-card overflow-hidden border border-white/10 dark:border-stone-200/50 group-hover:border-brand-heaven-gold/50 transition-all duration-700 bg-black dark:bg-white relative shadow-inner">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out"
          />

          {/* Inner Glow Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-brand-heaven-gold/20 via-transparent to-transparent transition-opacity duration-700 pointer-events-none" />

          {/* Flags Overlay - Sharp */}
          <div className="absolute bottom-0 right-0 p-1.5 flex gap-1 bg-black/80 backdrop-blur-md border-t border-l border-white/20 rounded-tl-card shadow-2xl z-10 transition-transform duration-500 group-hover:translate-x-0 group-hover:translate-y-0">
            {showDualFlags ? (
              <>
                <span className="text-lg leading-none" title="Nationality">{participant.nationality.flag}</span>
                <span className="text-lg leading-none" title="Residency">{participant.country.flag}</span>
              </>
            ) : (
              <span className="text-lg leading-none">{participant.country.flag}</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        {/* 2. Full Name */}
        <h3 className="text-sm md:text-base font-avenir-bold text-white dark:text-black mb-1.5 uppercase tracking-wider group-hover:text-brand-heaven-gold transition-colors duration-500 line-clamp-1">
          {participant.name}
        </h3>

        {/* 3. Role */}
        <p className="text-[10px] md:text-xs font-avenir-medium text-brand-heaven-gold mb-4 uppercase tracking-[3px] opacity-90 group-hover:opacity-100 transition-opacity">
          {participant.title}
        </p>

        {/* 4. Organization */}
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-white/50 dark:text-black/50 font-avenir-roman mb-8 min-h-[1.5rem] w-full px-2">
          <Building2 size={12} className="text-brand-heaven-gold/60 shrink-0" />
          <span className="truncate line-clamp-1 max-w-[90%]">{participant.organization}</span>
        </div>

        {/* 5. View More Button - Refined */}
        <div className="w-full pt-6 border-t border-white/5 dark:border-stone-100/50 flex flex-col items-center">
          <button className="flex items-center gap-2 px-6 py-3.5 min-h-[44px] bg-white/5 dark:bg-black/5 group-hover:bg-brand-heaven-gold group-hover:text-white rounded-button text-[10px] md:text-xs font-avenir-bold text-brand-heaven-gold dark:text-black hover:scale-105 active:scale-95 uppercase transition-all tracking-[3px]">
            View Profile
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCard;
