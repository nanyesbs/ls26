import { COUNTRY_LIST, COUNTRY_SYNONYMS } from './constants';
import { Participant, Country } from './types';

// Heuristic to detect and fix common "Double Encoding" (UTF-8 interpreted as Latin-1)
// Examples: Ã« -> ë, Ã¶ -> ö, Ã© -> é
export const fixEncoding = (str: string): string => {
    if (!str) return '';

    // Check for common UTF-8 double-encoding patterns using regex
    // These ranges cover many 2-byte UTF-8 sequences that look like pairs of Latin-1 chars
    // especially those starting with Ã (0xC3) or Å (0xC5) which are very common.
    // If we see significantly "messy" patterns, we attempt to repair.

    try {
        // Test if string looks like it has been misinterpreted. 
        // A simple test: decode strict latin1 to bytes, then decode as utf-8.
        // If successful and results in "cleaner" text, use it.

        // However, in JS, strings are UTF-16. If "Ã«" exists, it means 0xC3 0xAB were read as two Code Points.
        // We want to turn Code Point 0xC3 + Code Point 0xAB -> Byte 0xC3 + Byte 0xAB -> UTF-8 sequence -> Code Point 0xEB (ë)

        const bytes = new Uint8Array(str.length);
        let lookslikeDoubleEncoded = false;
        let messyCount = 0;

        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            // If chars are within Latin-1 range (0-255), we can potentially map back to bytes.
            // If we have high chars (>255), it's unlikely to be simple Latin-1 misinterpretation, or it's mixed.
            if (code > 255) return str; // Safety valve: content already has wide chars, unlikely to be pure Latin-1 misread

            bytes[i] = code;

            // Count suspicious characters often found in Mojibake (Ã, Å, Â, etc.)
            if ((code >= 0xC2 && code <= 0xDF) || (code >= 0xE0 && code <= 0xEF)) {
                messyCount++;
            }
        }

        // If very clean string, don't touch
        if (messyCount === 0) return str;

        // Attempt decode
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const decoded = decoder.decode(bytes);
        return decoded;
    } catch (e) {
        // Decoding failed (invalid utf-8 sequences), return original
        return str;
    }
};

// Transliteration map for Cyrillic (minimalist but covers common A-Z needs)
const CYRILLIC_TO_LATIN: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'e': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

/**
 * Converts Google Drive sharing links to direct embeddable image URLs.
 * Handles /file/d/ID/view, open?id=ID, and direct IDs.
 */
export const convertDriveUrl = (url: string): string => {
    if (!url) return '';

    // If it's already a direct data URL, keep it
    if (url.startsWith('data:')) return url;

    // If it doesn't look like a Google link, keep it
    if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) return url;

    try {
        let fileId = '';
        if (url.includes('id=')) {
            fileId = url.split('id=')[1].split('&')[0];
        } else if (url.includes('/d/')) {
            fileId = url.split('/d/')[1].split('=')[0].split('/')[0]; // Handle /d/ID=s... cases
        } else if (url.includes('/folders/')) {
            return url;
        }

        // Use the lh3.googleusercontent.com CDN format with a size parameter
        // This is the most reliable way to embed Google Drive images publicly
        return fileId ? `https://lh3.googleusercontent.com/d/${fileId}=s1000` : url;
    } catch (e) {
        return url;
    }
};

/**
 * Strips emojis and special symbols for cleaner text comparison.
 */
export const stripEmojis = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Basic emojis
        .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '') // Flag emojis
        .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
        .replace(/\s+/g, ' ')
        .trim();
};

export const normalizeString = (str: string): string => {
    if (!str) return '';

    let result = str;

    // 1. Cyrillic Transliteration
    result = result.split('').map(char => CYRILLIC_TO_LATIN[char] || char).join('');

    // 2. Specific ligatures and special chars
    result = result
        .replace(/ß/g, 'ss')
        .replace(/Ø/g, 'O').replace(/ø/g, 'o')
        .replace(/Ł/g, 'L').replace(/ł/g, 'l')
        .replace(/Æ/g, 'AE').replace(/æ/g, 'ae')
        .replace(/Œ/g, 'OE').replace(/œ/g, 'oe')
        .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces

    // 3. Decompose and remove diacritics
    return result
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9\s-]/g, "")
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
};

/**
 * Converts a 2-letter ISO country code to a flag emoji.
 */
export const getFlagEmoji = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

/**
 * Finds a country by name or code, stripping emojis for comparison.
 * Preserves the original emoji if present in the input.
 */
export const findCountry = (nameOrCode: string): Country => {
    if (!nameOrCode) return { name: 'Global', flag: '🌍', code: '??' };

    const originalText = nameOrCode.toString().trim();
    const emojiMatch = originalText.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    const originalEmoji = emojiMatch ? emojiMatch[0] : null;

    const input = stripEmojis(originalText).toLowerCase();

    // 1. Direct match or synonym
    const mappedCode = COUNTRY_SYNONYMS[input];
    const match = COUNTRY_LIST.find(c =>
        c.name.toLowerCase() === input ||
        c.code.toLowerCase() === input ||
        (mappedCode && c.code === mappedCode)
    );

    if (match) {
        return {
            ...match,
            flag: originalEmoji || match.flag
        };
    }

    // 2. Fallback: Try to use the original emoji if it looks like a flag
    if (originalEmoji) {
        return {
            name: input.charAt(0).toUpperCase() + input.slice(1) || 'Global',
            flag: originalEmoji,
            code: '??'
        };
    }

    // 3. Last fallback: Return a generic "Global" country instead of a specific one like Germany
    return {
        name: input ? (input.charAt(0).toUpperCase() + input.slice(1)) : 'Global',
        flag: '🌍',
        code: '??'
    };
};

/**
 * Ensures a participant object follows all mandatory processing rules:
 * - Fixes encoding (Mojibake correction)
 * - Converts to UTF-8 concepts
 * - Generates normalized search fields
 * - Validates mandatory structure
 */
export const processParticipant = (data: any): any => {
    const clean = (val: any) => fixEncoding(val?.toString() || '').trim();

    const participant = {
        ...data,
        name: clean(data.name || data.fullname || 'Unnamed Delegate'),
        organization: clean(data.organization || data.ministryname || data.church || ''),
        title: clean(data.title || data.roles || data.role || ''),
        testimony: clean(data.testimony || data.bio || ''),
        shortBio: clean(data.shortBio || data.short_bio || ''),
        orgDescription: clean(data.orgDescription || data.ministrydescription || data.description || ''),
        phone: clean(data.phone || ''),
        email: clean(data.email || '').toLowerCase(),
        contactEmail: clean(data.contactEmail || data.contact_email || ''),
        website: clean(data.website || ''),
        otherInfo: clean(data.otherInfo || data.othercontact || data.other || ''),
        upcomingEvents: clean(data.upcomingEvents || data.upcoming_events || ''),
        dietaryRestrictions: clean(data.dietaryRestrictions || data.dietary_restrictions || ''),
        photoUrl: convertDriveUrl(data.photoUrl || data.profilepicture || ''),
        promoPhotoUrl: convertDriveUrl(data.promoPhotoUrl || data.promopicture || ''),
    };

    // Mandatory generated fields for A-Z sorting and filtering
    participant.searchName = normalizeString(participant.name);
    participant.searchOrg = normalizeString(participant.organization);

    return participant;
};

interface SortableParticipant {
    searchName: string;
}

export function sortParticipants<T extends SortableParticipant>(items: T[]): T[] {
    return [...items].sort((a, b) => (a.searchName || '').localeCompare(b.searchName || ''));
}

