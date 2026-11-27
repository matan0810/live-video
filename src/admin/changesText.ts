/** "שינוי אחד", "2 שינויים": Hebrew counts one in the singular, without the number. */
export const changesText = (count: number) => (count === 1 ? 'שינוי אחד' : `${count} שינויים`);
