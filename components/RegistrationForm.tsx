
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { COUNTRY_LIST } from '../constants';
import { findCountry, processParticipant } from '../utils';
import { ChevronRight, ChevronLeft, Save, Send, Camera, Sparkles, User, Mail, Globe, Phone, Building2, Info, Loader2, CheckCircle2 } from 'lucide-react';

const RegistrationForm: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Identity
        email: '',
        fullName: '',
        residentCountry: '',
        nationality: '',
        shortBio: '',
        // Step 2: Ministry
        profilePicture: null as File | null,
        ministryName: '',
        roles: '',
        ministryDescription: '',
        promoPicture: null as File | null,
        // Step 3: Contact & Extras
        phone: '',
        contactEmail: '',
        website: '',
        otherContact: '',
        // Step 4: Testimony & Dietary
        testimony: '',
        upcomingEvents: '',
        dietaryRestrictions: '',
    });

    const [previewUrls, setPreviewUrls] = useState({
        profile: '',
        promo: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            setFormData(prev => ({ ...prev, [name]: file }));

            const url = URL.createObjectURL(file);
            setPreviewUrls(prev => ({
                ...prev,
                [name === 'profilePicture' ? 'profile' : 'promo']: url
            }));
        }
    };

    const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const prepareParticipantData = async () => {
        let photoUrl = '';
        let promoPhotoUrl = '';

        if (formData.profilePicture) {
            photoUrl = await api.uploadImage(formData.profilePicture, `profile-${formData.email}`);
        }

        if (formData.promoPicture) {
            promoPhotoUrl = await api.uploadImage(formData.promoPicture, `promo-${formData.email}`);
        }

        const rawParticipant = {
            name: formData.fullName,
            email: formData.email,
            title: formData.roles,
            organization: formData.ministryName,
            orgDescription: formData.ministryDescription,
            country: findCountry(formData.residentCountry),
            nationality: findCountry(formData.nationality),
            shortBio: formData.shortBio,
            testimony: formData.testimony,
            phone: formData.phone,
            website: formData.website,
            photoUrl: photoUrl,
            promoPhotoUrl: promoPhotoUrl,
            otherInfo: formData.otherContact,
            upcomingEvents: formData.upcomingEvents,
            contactEmail: formData.contactEmail,
            dietaryRestrictions: formData.dietaryRestrictions
        };

        return processParticipant(rawParticipant);
    };

    const handleSave = async (isSubmit = false) => {
        setLoading(true);
        setStatus(isSubmit ? 'submitting' : 'saving');
        setErrorMessage('');

        try {
            const processedData = await prepareParticipantData();
            await api.saveLeader(processedData);

            if (isSubmit) {
                setStatus('success');
            } else {
                setStatus('idle');
                alert('Draft saved successfully!');
            }
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'Error synchronization payload');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in text-center px-4">
                <div className="w-24 h-24 bg-brand-heaven-gold/20 rounded-full flex items-center justify-center mb-8 border border-brand-heaven-gold/40 shadow-glow">
                    <CheckCircle2 size={48} className="text-brand-heaven-gold" />
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white uppercase tracking-tighter mb-4 italic">Registration Complete</h2>
                <p className="text-white/60 font-avenir-roman max-w-md mx-auto mb-12">Your identity has been synchronized with the Leaders' Summit 2026 database. You are now part of the global network.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 min-h-[44px] bg-brand-heaven-gold text-white rounded-button font-avenir-bold uppercase text-sm md:text-base tracking-widest hover:scale-105 transition-all shadow-glow"
                >
                    Return to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            {/* Header Section */}
            <div className="mb-16 text-center">
                <h2 className="text-xs font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-4">Internal Protocol</h2>
                <h1 className="text-3xl md:text-6xl font-extrabold text-white uppercase tracking-tighter leading-none italic mb-6">Leaders' Summit '26 Registration</h1>
                <div className="flex items-center justify-center gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 ${step >= i ? 'border-brand-heaven-gold bg-brand-heaven-gold text-white shadow-glow-sm' : 'border-white/10 text-white/20'}`}>
                                <span className="text-xs font-avenir-bold">{i}</span>
                            </div>
                            {i < 4 && <div className={`w-6 md:w-12 h-[1px] ${step > i ? 'bg-brand-heaven-gold' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 rounded-card p-6 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-heaven-gold/5 blur-[100px] pointer-events-none" />

                <form onSubmit={(e) => e.preventDefault()} className="space-y-10 relative">

                    {/* STEP 1: ATTENDING LEADERS */}
                    {step === 1 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-4">
                                <h2 className="text-xs md:text-sm font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-2">Seção 1 de 4</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white uppercase tracking-wider mb-2">
                                    ESBS Leaders' Summit '26 - Attending Leaders
                                </h3>
                                <div className="text-xs md:text-sm text-white/60 font-avenir-roman space-y-4 leading-relaxed max-w-2xl">
                                    <p>Dear ESBS Leaders' Summit Attendees,</p>
                                    <p>We are very excited to meet with you in only a few short weeks! To help the networking and collaboration between our attendees, we are creating a brochure featuring all of the attending leaders. Each leader will have their short bio, and promotional materials to their ministries/events. We would also kindly ask you share a key testimony with us, as we would love to select a few leaders to share at the Leaders' Summit.</p>
                                    <p>See you soon!</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-avenir-bold text-brand-heaven-gold uppercase tracking-wide md:tracking-widest pl-1 flex items-center gap-2">
                                        <Mail size={12} /> E-mail *
                                    </label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        placeholder="your@email.com"
                                        className="w-full bg-white/5 border border-white/10 p-4 min-h-[44px] rounded-button text-sm md:text-base text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Full Name *</label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                        placeholder="Full Name"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                    <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-[0.05em] md:tracking-[0.1em] pl-1">NOTE: This name will appear on your badge.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1 flex items-center gap-2">
                                        <Globe size={12} /> Resident Country
                                    </label>
                                    <select
                                        name="residentCountry" value={formData.residentCountry} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all appearance-none"
                                    >
                                        <option value="" className="bg-[#0A0A0A]">Select country (Optional)</option>
                                        {COUNTRY_LIST.map(c => (
                                            <option key={c.code} value={c.name} className="bg-[#0A0A0A]">{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Nationality *</label>
                                    <select
                                        name="nationality" value={formData.nationality} onChange={handleChange} required
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all appearance-none"
                                    >
                                        <option value="" className="bg-[#0A0A0A]">Select country</option>
                                        {COUNTRY_LIST.map(c => (
                                            <option key={c.code} value={c.name} className="bg-[#0A0A0A]">{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Short biography *</label>
                                <textarea
                                    name="shortBio" value={formData.shortBio} onChange={handleChange} required
                                    rows={4}
                                    placeholder="Brief background and vision..."
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MINISTRY INFORMATION */}
                    {step === 2 && (
                        <div className="animate-slide-up space-y-10">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-2">
                                <h2 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-2">Seção 2 de 4</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white uppercase tracking-wider mb-2">
                                    Ministry Information
                                </h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">Please note the provided information will be made public to our attendees. If you do not consent, send an email to acsongedi@europeshallbesaved.org</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <Building2 size={12} /> Name of Ministry/Church/Organization/Business *
                                        </label>
                                        <input
                                            type="text" name="ministryName" value={formData.ministryName} onChange={handleChange} required
                                            placeholder="Organization Name"
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Role(s) in the organization *</label>
                                        <input
                                            type="text" name="roles" value={formData.roles} onChange={handleChange} required
                                            placeholder="e.g. CEO, Pastor, Creative"
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Description of your organization</label>
                                        <textarea
                                            name="ministryDescription" value={formData.ministryDescription} onChange={handleChange}
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest flex items-center gap-2">
                                            <Camera size={14} /> Profile Picture of You *
                                        </label>
                                        <p className="text-[8px] text-white/30 uppercase tracking-[0.1em] px-1 leading-normal">This photo will help other leaders to recognize you after the event. Please only upload a photo of yourself. This photo will appear in the Leaders' Brochure.</p>
                                        <div className="relative group">
                                            <div className="w-full aspect-square bg-white/5 border border-dashed border-white/20 rounded-card flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-brand-heaven-gold/50">
                                                {previewUrls.profile ? (
                                                    <img src={previewUrls.profile} className="w-full h-full object-cover" alt="Profile preview" />
                                                ) : (
                                                    <>
                                                        <User size={32} className="text-white/10 mb-2" />
                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Click to upload JPG/PNG</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file" name="profilePicture" onChange={handleFileChange} accept="image/*" required
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} /> Promotional Picture
                                        </label>
                                        <p className="text-[8px] text-white/30 uppercase tracking-[0.1em] px-1 leading-normal">If you would like to promote an event, initiative or your ministry, you are welcome to add it to this brochure.</p>
                                        <div className="relative group">
                                            <div className="w-full aspect-video bg-white/5 border border-dashed border-white/20 rounded-card flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-brand-heaven-gold/50">
                                                {previewUrls.promo ? (
                                                    <img src={previewUrls.promo} className="w-full h-full object-cover" alt="Promo preview" />
                                                ) : (
                                                    <>
                                                        <Camera size={32} className="text-white/10 mb-2" />
                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Company Flyer / Logo / Promo</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file" name="promoPicture" onChange={handleFileChange} accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: CONTACT INFO */}
                    {step === 3 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-2">
                                <h2 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-2">Seção 3 de 4</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white uppercase tracking-wider mb-2">
                                    How can other attendees contact you?
                                </h3>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                                    <p>NOTE: This information will be public for the other attendees.</p>
                                    <p>Only provide the personal information you WANT others to receive.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Phone Number</label>
                                    <input
                                        type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                        placeholder="+1 234 567 890"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Email Address</label>
                                    <input
                                        type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                                        placeholder="public@email.com"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Website</label>
                                    <input
                                        type="text" name="website" value={formData.website} onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Other</label>
                                    <input
                                        type="text" name="otherContact" value={formData.otherContact} onChange={handleChange}
                                        placeholder="@instagram / handle"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: TESTIMONIES & EXTRAS */}
                    {step === 4 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-2">
                                <h2 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-2">Seção 4 de 4</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white uppercase tracking-wider mb-2">
                                    Testimonies
                                </h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">We would love to hear your testimony of what God has done through you and your ministry last year. We will ask a few leaders on Tuesday to share.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Testimony *</label>
                                    <textarea
                                        name="testimony" value={formData.testimony} onChange={handleChange} required
                                        rows={5}
                                        placeholder="Share your story..."
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Upcoming Kingdom Events</label>
                                    <p className="text-[8px] text-white/30 uppercase tracking-[0.1em] mb-2 pl-1">If you have any events coming up with national or continental impact, please let us know the details!</p>
                                    <textarea
                                        name="upcomingEvents" value={formData.upcomingEvents} onChange={handleChange}
                                        rows={3}
                                        placeholder="Dates, location, vision..."
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-1">Please, let us know if you have dietary restrictions. *</label>
                                    <input
                                        type="text" name="dietaryRestrictions" value={formData.dietaryRestrictions} onChange={handleChange} required
                                        placeholder="write N/A if you have none"
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-button text-sm text-white outline-none focus:border-brand-heaven-gold transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-4 border border-white/10 text-white/50 rounded-button font-avenir-bold uppercase text-[10px] tracking-widest hover:text-white hover:border-white/20 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center"
                                >
                                    <ChevronLeft size={16} /> Back
                                </button>
                            )}
                            {step < 4 && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-8 py-4 bg-white text-black rounded-button font-avenir-bold uppercase text-[10px] tracking-widest hover:bg-brand-heaven-gold hover:text-white transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-lg"
                                >
                                    Next Phase <ChevronRight size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={loading}
                                className="px-6 py-4 bg-white/5 text-white rounded-button font-avenir-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center border border-white/10"
                            >
                                {status === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Draft
                            </button>
                            {step === 4 && (
                                <button
                                    type="button"
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="px-10 py-4 bg-brand-heaven-gold text-white rounded-button font-avenir-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center shadow-glow font-bold"
                                >
                                    {status === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Synchronize Bio
                                </button>
                            )}
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-button text-red-500 text-[10px] font-avenir-medium uppercase tracking-widest text-center animate-pulse">
                            Hardware synchronization failure: {errorMessage}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;
