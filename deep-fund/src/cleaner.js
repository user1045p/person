import * as v from 'valibot';

const ItemSchema = v.object({
  url: v.string(),
  title: v.string(),
});

export function cleanData(raw) {
  const cleaned = {
    url: raw.url?.trim() || '',
    title: raw.title?.slice(0, 200) || 'No Title',
  };

  const result = v.safeParse(ItemSchema, cleaned);
  if (!result.success) {
    console.warn('Validation warning:', result.issues);
  }
  return cleaned;
}