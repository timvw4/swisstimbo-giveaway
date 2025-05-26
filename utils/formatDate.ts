export function formatDrawDate(date: string | Date) {
  const dateObj = new Date(date);
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  return `${jours[dateObj.getDay()]}\n${dateFormatted}`;
} 