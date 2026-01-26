
import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { Building2, ChevronRight } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER } from '../constants';

interface ParticipantCardProps {
  participant: Participant;
  onClick: () => void;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onClick }) => {
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

  return (
    <div
      onClick={onClick}
      className="group relative bg-black dark:bg-stone-50 border border-white/10 dark:border-stone-200 hover:border-brand-heaven-gold transition-all duration-500 cursor-pointer overflow-hidden p-6 md:p-8 flex flex-col items-center text-center rounded-card shadow-card hover:shadow-2xl hover:-translate-y-1"
    >
      {/* 1. Profile Picture (Coloring & Flags) */}
      <div className="relative mb-8 w-full aspect-square max-w-[200px]">
        <div className="w-full h-full rounded-card overflow-hidden border border-white/10 dark:border-stone-200 group-hover:border-brand-heaven-gold transition-all duration-500 bg-black dark:bg-white relative">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
          />

          {/* Flags Overlay - Sharp */}
          <div className="absolute bottom-0 right-0 p-2 flex gap-1 bg-black/60 backdrop-blur-md border-t border-l border-white/10 rounded-tl-card">
            {showDualFlags ? (
              <>
                <span className="text-xl leading-none" title="Nationality">{participant.nationality.flag}</span>
                <span className="text-xl leading-none" title="Residency">{participant.country.flag}</span>
              </>
            ) : (
              <span className="text-xl leading-none">{participant.country.flag}</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        {/* 2. Full Name */}
        <h3 className="text-base md:text-lg font-avenir-bold text-white dark:text-black mb-2 uppercase tracking-wide group-hover:text-brand-heaven-gold transition-colors">
          {participant.name}
        </h3>

        {/* 3. Role */}
        <p className="text-xs md:text-sm font-avenir-medium text-brand-heaven-gold mb-3 uppercase tracking-[2px] opacity-80">
          {participant.title}
        </p>

        {/* 4. Organization */}
        <div className="flex items-center justify-center gap-2 text-sm md:text-base text-white/60 dark:text-black/60 font-avenir-roman mb-8 min-h-[2rem]">
          <Building2 size={14} className="text-brand-heaven-gold shrink-0" />
          <span className="truncate line-clamp-2 max-w-[200px]">{participant.organization}</span>
        </div>

        {/* 5. View More Button */}
        <div className="w-full pt-6 border-t border-white/10 dark:border-stone-100 flex flex-col items-center">
          <button className="flex items-center gap-2 px-8 py-4 min-h-[44px] bg-white/5 dark:bg-black/5 group-hover:bg-brand-heaven-gold group-hover:text-white rounded-button text-xs md:text-sm font-avenir-bold text-brand-heaven-gold dark:text-black uppercase transition-all tracking-[2px] md:tracking-[3px]">
            View Profile
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCard;
