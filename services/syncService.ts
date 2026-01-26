import * as XLSX from 'xlsx';
import { Participant } from '../types';
import { processParticipant, findCountry } from '../utils';
import { api } from './api';

export const syncService = {
    processDataRows: (data: any[], existingParticipants: Participant[]) => {
        const emailToId = new Map(existingParticipants.map(p => [p.email?.toLowerCase().trim(), p.id]));
        const results = {
            valid: [] as { p: Omit<Participant, 'id'>, id?: string }[],
            duplicateCount: 0,
            total: data.length
        };

        for (const row of data) {
            const email = (row['Email Address'] || row['Email'] || row['Email address'] || '').toString().toLowerCase().trim();
            if (!email) continue;

            const existingId = emailToId.get(email);

            const rawData = {
                name: row['Full Name'] || row['Name'],
                country: findCountry(row['Country'] || row['Location'] || row['Residency']),
                nationality: findCountry(row['Nationality'] || row['Country'] || row['Location']),
                testimony: row['Short biography'] || row['Bio'] || row['Testimony'],
                orgDescription: row['Description of your organization'] || row['Description'] || row['Org Description'],
                photoUrl: row['Profile Picture of You'] || row['Profile picture'] || row['Photo URL'] || row['Photo'],
                organization: row['Name of Ministry/Church/Organization/Business'] || row['Church / Organization'] || row['Organization'] || row['Ministry'] || row['Church'],
                title: row['Role(s) in the organization'] || row['Role'] || row['Title'] || row['Position'],
                promoPhotoUrl: row['Promotional Picture'] || row['Promo picture'] || row['Promo Photo'] || row['Promo'],
                phone: row['Phone Number'] || row['Phone number'] || row['Phone'],
                email: email,
                website: row['Website'],
                otherInfo: row['Other'] || row['Other Information'],
            };

            const processed = processParticipant(rawData);
            results.valid.push({ p: processed, id: existingId });
            if (existingId) results.duplicateCount++;
        }

        return results;
    },

    fetchFromSheet: async (sheetUrl: string, existingParticipants: Participant[]) => {
        let url = sheetUrl.trim();
        if (url.includes('docs.google.com/spreadsheets/d/')) {
            const id = url.split('/d/')[1].split('/')[0];
            url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network failure');
        const text = await response.text();

        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        return syncService.processDataRows(data, existingParticipants);
    },

    performSync: async (
        items: { p: Omit<Participant, 'id'>, id?: string }[],
        onProgress?: (progress: string) => void,
        onAdd?: (p: Omit<Participant, 'id'>) => Promise<any>,
        onUpdate?: (id: string, p: Partial<Participant>) => Promise<any>
    ) => {
        let count = 0;
        for (const item of items) {
            if (onProgress) onProgress(`Syncing ${++count} / ${items.length}...`);
            if (item.id && onUpdate) {
                await onUpdate(item.id, item.p);
            } else if (onAdd) {
                await onAdd(item.p);
            }
        }
    },

    batchSyncFromSheet: async (sheetUrl: string) => {
        let url = sheetUrl.trim();
        if (url.includes('docs.google.com/spreadsheets/d/')) {
            const id = url.split('/d/')[1].split('/')[0];
            url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network failure');
        const text = await response.text();

        const wb = XLSX.read(text, { type: 'string' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Fetch existing to preserve IDs if possible, though email unique constraint handles the heavy lifting
        const existing = await api.getParticipants();
        const emailToId = new Map(existing.map(p => [p.email?.toLowerCase().trim(), p.id]));

        const participants: any[] = [];

        for (const row of data) {
            const email = (row['Email Address'] || row['Email'] || row['Email address'] || '').toString().toLowerCase().trim();
            if (!email) continue;

            const existingId = emailToId.get(email);

            const rawData = {
                name: row['Full Name'] || row['Name'],
                country: findCountry(row['Country'] || row['Location'] || row['Residency']),
                nationality: findCountry(row['Nationality'] || row['Country'] || row['Location']),
                testimony: row['Short biography'] || row['Bio'] || row['Testimony'],
                orgDescription: row['Description of your organization'] || row['Description'] || row['Org Description'],
                photoUrl: row['Profile Picture of You'] || row['Profile picture'] || row['Photo URL'] || row['Photo'],
                organization: row['Name of Ministry/Church/Organization/Business'] || row['Church / Organization'] || row['Organization'] || row['Ministry'] || row['Church'],
                title: row['Role(s) in the organization'] || row['Role'] || row['Title'] || row['Position'],
                promoPhotoUrl: row['Promotional Picture'] || row['Promo picture'] || row['Promo Photo'] || row['Promo'],
                phone: row['Phone Number'] || row['Phone number'] || row['Phone'],
                email: email,
                website: row['Website'],
                otherInfo: row['Other'] || row['Other Information'],
            };

            const processed = processParticipant(rawData);
            // Ensure ID is present for upsert
            participants.push({
                ...processed,
                id: existingId || Math.random().toString(36).substring(2, 7).toUpperCase()
            });
        }

        if (participants.length > 0) {
            await api.bulkUpsertParticipants(participants);
        }
    }
};
