
export interface Country {
  name: string;
  flag: string;
  code: string;
}

export interface Participant {
  id: string;
  name: string;
  title: string;
  organization: string;
  orgDescription?: string;
  country: Country; // Residency/Current Node
  nationality: Country; // Origin/Heritage
  shortBio?: string;
  testimony: string;
  phone: string;
  email: string;
  website: string;
  photoUrl: string;
  promoPhotoUrl?: string;
  otherInfo?: string;
  events?: string[]; // Legacy sync field
  upcomingEvents?: string; // New registration field
  contactEmail?: string;
  dietaryRestrictions?: string;
  // Normalized fields for A-Z search/sort
  searchName: string;
  searchOrg: string;
}

export type ViewMode = 'directory' | 'admin' | 'registration';
