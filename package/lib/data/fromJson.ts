import { SectionType } from '../../components/section';

export const fromJsonValue = (
  value?: string | SectionType[] | undefined
): SectionType[] => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  // try {
  if (value === '[]' || value.startsWith('[{')) {
    return JSON.parse(value);
  }

  return [];
};
