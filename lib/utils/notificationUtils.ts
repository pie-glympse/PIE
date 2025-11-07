/**
 * Ajoute une nouvelle notification via l'API
 */
export async function addNotification(
  userId: string | number,
  message: string,
  type?: string,
  eventId?: string | number
) {
  if (typeof window === 'undefined') return; // Vérifier si on est côté client

  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message,
        type,
        eventId,
      }),
    });

    if (response.ok) {
      // Déclencher l'événement pour notifier le Header
      window.dispatchEvent(new Event('notificationsUpdated'));
    } else {
      console.error('Erreur création notification');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

/**
 * Récupère toutes les notifications d'un utilisateur
 */
export async function getNotifications(userId: string | number) {
  if (typeof window === 'undefined') return [];

  try {
    const response = await fetch(`/api/notifications?userId=${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return [];
  }
}

/**
 * Récupère le nombre de notifications non lues d'un utilisateur
 */
export async function getUnreadCount(userId: string | number): Promise<number> {
  if (typeof window === 'undefined') return 0;

  try {
    const notifications = await getNotifications(userId);
    return notifications.filter((n: any) => !n.read).length;
  } catch (error) {
    console.error('Erreur compteur notifications:', error);
    return 0;
  }
}
