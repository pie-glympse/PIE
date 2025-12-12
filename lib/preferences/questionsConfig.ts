// Configuration des questions de préférences par type d'événement
// Chaque réponse a un poids pour différents tags Google Maps

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple';
  answers: Answer[];
}

export interface Answer {
  id: string;
  text: string;
  // Poids pour chaque tag Google Maps (0 = pas d'impact, 1+ = impact positif)
  googleMapsTags: Record<string, number>;
}

export interface QuestionsConfig {
  [activityType: string]: Question[];
}

// Configuration par défaut - sera complétée avec les questions spécifiques
export const questionsConfig: QuestionsConfig = {
  'Gastronomie': [],
  'Culture': [],
  'Nature & Bien-être': [],
  'Divertissement': [],
  'Sport': [
    {
      id: 'sport-q1',
      text: 'Quel type d\'effort préfères-tu ?',
      type: 'single',
      answers: [
        {
          id: 'sport-q1-a1',
          text: 'Cardio / Endurance',
          googleMapsTags: {
            'fitness_center': 2,
            'gym': 2,
            'athletic_field': 2,
          },
        },
        {
          id: 'sport-q1-a2',
          text: 'Doux / Relax',
          googleMapsTags: {
            'swimming_pool': 2,
            'fishing_pond': 2,
            'sports_activity_location': 2,
          },
        },
        {
          id: 'sport-q1-a3',
          text: 'Adrénaline / Fun',
          googleMapsTags: {
            'ice_skating_rink': 2,
            'ski_resort': 2,
            'arena': 2,
          },
        },
        {
          id: 'sport-q1-a4',
          text: 'Sport collectif',
          googleMapsTags: {
            'sports_club': 2,
            'stadium': 2,
            'sports_complex': 2,
          },
        },
        {
          id: 'sport-q1-a5',
          text: 'Technique / Ciblé',
          googleMapsTags: {
            'sports_coaching': 2,
            'golf_course': 2,
          },
        },
      ],
    },
    {
      id: 'sport-q2',
      text: 'Tu aimerais faire cette activité :',
      type: 'single',
      answers: [
        {
          id: 'sport-q2-a1',
          text: 'En intérieur',
          googleMapsTags: {
            'gym': 2,
            'fitness_center': 2,
            'sports_complex': 2,
            'arena': 2,
            'ice_skating_rink': 2,
          },
        },
        {
          id: 'sport-q2-a2',
          text: 'En extérieur',
          googleMapsTags: {
            'athletic_field': 2,
            'golf_course': 2,
            'fishing_pond': 2,
            'playground': 2,
          },
        },
        {
          id: 'sport-q2-a3',
          text: 'En nature',
          googleMapsTags: {
            'ski_resort': 2,
            'fishing_charter': 2,
            'fishing_pond': 2,
          },
        },
        {
          id: 'sport-q2-a4',
          text: 'Peu importe',
          googleMapsTags: {
            'gym': 1,
            'fitness_center': 1,
            'sports_complex': 1,
            'arena': 1,
            'ice_skating_rink': 1,
            'athletic_field': 1,
            'golf_course': 1,
            'fishing_pond': 1,
            'playground': 1,
            'ski_resort': 1,
            'fishing_charter': 1,
            'swimming_pool': 1,
            'sports_club': 1,
            'stadium': 1,
            'sports_coaching': 1,
            'sports_activity_location': 1,
          },
        },
      ],
    },
    {
      id: 'sport-q3',
      text: 'Tu préfères une activité :',
      type: 'single',
      answers: [
        {
          id: 'sport-q3-a1',
          text: 'Très dynamique',
          googleMapsTags: {
            'arena': 2,
            'sports_complex': 2,
            'stadium': 2,
          },
        },
        {
          id: 'sport-q3-a2',
          text: 'Modérée',
          googleMapsTags: {
            'sports_club': 2,
            'gym': 2,
            'swimming_pool': 2,
          },
        },
        {
          id: 'sport-q3-a3',
          text: 'Très chill',
          googleMapsTags: {
            'fishing_pond': 2,
            'fishing_charter': 2,
            'playground': 2,
          },
        },
      ],
    },
    {
      id: 'sport-q4',
      text: 'Quel format d\'activité t\'attire le plus ?',
      type: 'single',
      answers: [
        {
          id: 'sport-q4-a1',
          text: 'Sport en équipe',
          googleMapsTags: {
            'sports_club': 3,
            'stadium': 3,
            'sports_complex': 3,
          },
        },
        {
          id: 'sport-q4-a2',
          text: 'Sport individuel',
          googleMapsTags: {
            'gym': 3,
            'fitness_center': 3,
            'golf_course': 3,
          },
        },
        {
          id: 'sport-q4-a3',
          text: 'Activité ludique',
          googleMapsTags: {
            'ice_skating_rink': 3,
            'playground': 3,
          },
        },
        {
          id: 'sport-q4-a4',
          text: 'Activité bien-être',
          googleMapsTags: {
            'swimming_pool': 3,
            'sports_activity_location': 3,
          },
        },
        {
          id: 'sport-q4-a5',
          text: 'Activité de pleine nature',
          googleMapsTags: {
            'fishing_charter': 3,
            'fishing_pond': 3,
            'ski_resort': 3,
          },
        },
      ],
    },
    {
      id: 'sport-q5',
      text: 'Niveau d\'intensité souhaité',
      type: 'single',
      answers: [
        {
          id: 'sport-q5-a1',
          text: 'Doux',
          googleMapsTags: {
            'swimming_pool': 2,
            'fishing_pond': 2,
            'playground': 2,
          },
        },
        {
          id: 'sport-q5-a2',
          text: 'Moyen',
          googleMapsTags: {
            'sports_club': 2,
            'gym': 2,
            'fitness_center': 2,
          },
        },
        {
          id: 'sport-q5-a3',
          text: 'Intense',
          googleMapsTags: {
            'athletic_field': 2,
            'stadium': 2,
            'arena': 2,
          },
        },
      ],
    },
    {
      id: 'sport-q6',
      text: 'Préfères-tu :',
      type: 'single',
      answers: [
        {
          id: 'sport-q6-a1',
          text: 'Lieu structuré / encadré',
          googleMapsTags: {
            'sports_complex': 2,
            'sports_club': 2,
            'sports_coaching': 2,
          },
        },
        {
          id: 'sport-q6-a2',
          text: 'Lieu libre',
          googleMapsTags: {
            'playground': 2,
            'park': 2,
            'athletic_field': 2,
          },
        },
        {
          id: 'sport-q6-a3',
          text: 'Expérience unique',
          googleMapsTags: {
            'fishing_charter': 2,
            'ski_resort': 2,
          },
        },
      ],
    },
    {
      id: 'sport-q7',
      text: 'Qu\'est-ce qui te motive le plus ?',
      type: 'single',
      answers: [
        {
          id: 'sport-q7-a1',
          text: 'Se dépasser physiquement',
          googleMapsTags: {
            'athletic_field': 4,
            'gym': 4,
            'fitness_center': 4,
          },
        },
        {
          id: 'sport-q7-a2',
          text: 'S\'amuser sans pression',
          googleMapsTags: {
            'playground': 4,
            'ice_skating_rink': 4,
          },
        },
        {
          id: 'sport-q7-a3',
          text: 'Déconnecter / se détendre',
          googleMapsTags: {
            'fishing_pond': 4,
            'swimming_pool': 4,
          },
        },
        {
          id: 'sport-q7-a4',
          text: 'Vivre une expérience rare',
          googleMapsTags: {
            'fishing_charter': 4,
            'ski_resort': 4,
          },
        },
        {
          id: 'sport-q7-a5',
          text: 'Apprendre ou progresser',
          googleMapsTags: {
            'sports_coaching': 4,
            'sports_club': 4,
          },
        },
      ],
    },
  ],
  // Configuration par défaut si le type n'est pas reconnu
  'default': [],
};

// Fonction pour obtenir les questions selon le type d'événement
export function getQuestionsForActivityType(activityType?: string): Question[] {
  if (!activityType) {
    return questionsConfig['default'] || [];
  }
  return questionsConfig[activityType] || questionsConfig['default'] || [];
}

// Fonction pour calculer les poids totaux des tags Google Maps à partir des réponses
export function calculateGoogleMapsTagsWeights(
  answers: { questionId: string; answerIds: string[] }[],
  activityType?: string
): Record<string, number> {
  const weights: Record<string, number> = {};

  // Obtenir les questions pour le type d'événement spécifique
  const questions = getQuestionsForActivityType(activityType);

  answers.forEach(({ questionId, answerIds }) => {
    // Trouver la question correspondante dans les questions du type d'événement
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      console.warn(`Question non trouvée: ${questionId} pour le type ${activityType}`);
      return;
    }

    // Pour chaque réponse sélectionnée, ajouter les poids
    answerIds.forEach(answerId => {
      const answer = question.answers.find(a => a.id === answerId);
      if (answer) {
        Object.entries(answer.googleMapsTags).forEach(([tag, weight]) => {
          weights[tag] = (weights[tag] || 0) + weight;
        });
      } else {
        console.warn(`Réponse non trouvée: ${answerId} pour la question ${questionId}`);
      }
    });
  });

  return weights;
}
