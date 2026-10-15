export type Area = {
  id: number;
  name: string;
  color: string;
};

export type Person = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  introduced_by: number | null;
};

export type Meeting = {
  id: number;
  person_id: number;
  date_text: string | null;
  place: string | null;
  area_id: number | null;
  note: string | null;
};

export type Link = {
  id: number;
  a_id: number;
  b_id: number;
  kind: string;
  note: string | null;
};

export const LINK_KINDS = [
  'friends',
  'family',
  'partners',
  'colleagues',
  'classmates',
  'teammates',
  'other',
] as const;
