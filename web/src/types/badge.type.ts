/** Badges shown next to a user's name. Shared by the web app and the CMS. */
export interface VerifiedBadge {
  /** owner | tutor | berprestasi */
  label: string;
  label_name: string;
  verified_at: string;
}

export interface PackageBadge {
  code: string;
  name: string;
}

export interface UserBadges {
  /** Blue check; granted only by an admin. */
  verified?: VerifiedBadge;
  profile_complete: boolean;
  /** Profile fields still empty (keys of the profile form). */
  profile_missing?: string[];
  /** Highest paid package the user holds. */
  package?: PackageBadge;
}

export const VERIFIED_LABELS: { value: string; label: string }[] = [
  { value: 'owner', label: 'Owner TELISIK' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'berprestasi', label: 'Siswa Berprestasi' }
];

/** Profile fields needed for the "Profil Lengkap" badge. */
export const PROFILE_FIELD_LABELS: Record<string, string> = {
  name: 'Nama lengkap',
  phone_number: 'Nomor WhatsApp',
  gender: 'Jenis kelamin',
  birth_date: 'Tanggal lahir',
  last_education: 'Pendidikan terakhir',
  province: 'Provinsi',
  regency: 'Kabupaten/kota',
  target_agency: 'Instansi tujuan'
};
