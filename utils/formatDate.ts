export function formatDrawDate(date: string | Date) {
  const dateObj = new Date(date);
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  
  const jour = jours[dateObj.getDay()];
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  // On force le format voulu avec un saut de ligne après le jour
  return `${jour}\n${dateFormatted}`;
} 