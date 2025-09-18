export const pastelColors = [
  'bg-pastel-magnolia',
  'bg-pastel-mint_cream',
  'bg-pastel-light_blue',
  'bg-pastel-isabelline',
  'bg-pastel-lavender_web',
  'bg-pastel-periwinkle',
];

/**
 * Picks a deterministic color from the pastelColors array based on a string ID.
 * This creates a pseudo-random look that is stable across re-renders.
 * @param id The unique identifier of the item (e.g., article or category ID).
 * @returns A Tailwind CSS background color class string.
 */
export const getColorFromId = (id: string): string => {
  if (!id) {
    return pastelColors[0];
  }
  // Create a simple hash from the ID string
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pastelColors[hash % pastelColors.length];
};