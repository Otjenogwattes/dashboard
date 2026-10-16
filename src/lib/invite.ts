/** Deel de app-link met je partner (deelmenu op de telefoon, anders klembord). */
export async function invitePartner(name: string): Promise<void> {
  const url = window.location.origin;
  const text = `Hoi ${name}! Log in op Balkon en koppel je Spotify, dan zien we wat we allebei draaien.`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Balkon', text, url });
    } catch {
      /* geannuleerd */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    alert('Uitnodiging gekopieerd. Plak hem in een berichtje.');
  } catch {
    prompt('Kopieer deze uitnodiging:', `${text} ${url}`);
  }
}
