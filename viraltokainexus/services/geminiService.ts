
// Fix: Replaced GenerateContentRequest with GenerateContentParameters and GenerateImagesRequest with GenerateImagesParameters
// based on @google/genai coding guidelines. The guideline explicitly states GenerateContentRequest -> GenerateContentParameters.
// A similar pattern is assumed for GenerateImagesRequest -> GenerateImagesParameters as GenerateImagesRequest is not exported.
import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse, GenerateContentParameters, GenerateImagesParameters } from "@google/genai";
import { ScriptData, PublishingSuggestions, GeneratedImage, ScriptSegment, AgentStrategicStyle, VoiceOverPlaceholder, MusicPlaceholder, TrendingTopicsAnalysis, AIChoice } from '../types';
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, MAX_SEGMENTS_FOR_VISUALS, IMAGES_PER_SEGMENT } from '../constants';

// Error messages related to API Key
export const ENV_API_KEY_MISSING_ERROR = "La variable d'environnement API_KEY pour Google Gemini n'est pas définie. Veuillez la configurer dans votre environnement d'exécution.";
export const API_KEY_INVALID_ERROR = "La clé API (fournie via la variable d'environnement API_KEY) est invalide, expirée, ou n'a pas les permissions nécessaires pour accéder à l'API Gemini. Veuillez vérifier la clé et les configurations de votre projet Google Cloud.";
export const API_CLIENT_INIT_ERROR = "Échec de l'initialisation du client Gemini. Assurez-vous que la variable d'environnement API_KEY est correctement configurée.";


let ai: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error(ENV_API_KEY_MISSING_ERROR);
      throw new Error(ENV_API_KEY_MISSING_ERROR);
    }
    try {
      ai = new GoogleGenAI({ apiKey });
    } catch (initError: any) {
        console.error("Erreur lors de l'initialisation de GoogleGenAI:", initError);
        throw new Error(`${API_CLIENT_INIT_ERROR} Détails: ${initError.message || initError}`);
    }
  }
  return ai;
};

// Helper pour les tentatives de relance
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 seconde

// Fix: Updated type constraints from GenerateContentRequest to GenerateContentParameters and GenerateImagesRequest to GenerateImagesParameters.
async function retryableApiCall<T extends GenerateContentParameters | GenerateImagesParameters, R extends GenerateContentResponse | GenerateImagesResponse>(
  apiCallFn: (params: T) => Promise<R>,
  params: T,
  signal?: AbortSignal
): Promise<R> {
  let attempts = 0;
  let currentDelay = INITIAL_RETRY_DELAY_MS;

  while (attempts < MAX_RETRIES) {
    if (signal?.aborted) {
      throw new DOMException('Opération annulée par le signal avant la tentative.', 'AbortError');
    }
    try {
      return await apiCallFn(params);
    } catch (error: any) {
      attempts++;
      const status = error?.response?.status || error?.status || (error instanceof Error && error.message.includes("got status:") ? parseInt(error.message.split("got status:")[1].trim().split(" ")[0]) : null);
      const isHttpError = typeof status === 'number';
      
      // Do not retry for API key configuration errors or client-side errors (4xx, except 429)
      if (error.message === ENV_API_KEY_MISSING_ERROR || error.message.startsWith(API_CLIENT_INIT_ERROR.substring(0,10)) || error.message.startsWith(API_KEY_INVALID_ERROR.substring(0,10))) {
        throw error;
      }

      if (error.name === 'AbortError' || (isHttpError && status >= 400 && status < 500 && status !== 429)) {
        throw error; 
      }

      if (attempts >= MAX_RETRIES || !(isHttpError && (status === 429 || (status >= 500 && status < 600)))) {
         if (isHttpError && status === 429) {
             console.warn(`Tentative ${attempts}/${MAX_RETRIES} a échoué avec 429 (Quota Exceeded). Pas de nouvelle tentative pour cette erreur.`);
             const quotaErrorMessage = `Quota API dépassé (429). Veuillez vérifier votre plan et vos informations de facturation Google. Consultez la console Google Cloud pour plus de détails sur les limites de votre API Gemini. Erreur originale: ${error.message}`;
             const quotaError = new Error(quotaErrorMessage);
             (quotaError as any).status = 429; 
             (quotaError as any).cause = error; 
             throw quotaError;
         }
         if (attempts >= MAX_RETRIES){
            console.error(`Tentative ${attempts}/${MAX_RETRIES} a échoué. Abandon après la dernière tentative. Erreur: `, error);
            throw error;
         }
      }
      
      console.warn(`Tentative ${attempts}/${MAX_RETRIES} a échoué (status: ${status}). Nouvelle tentative dans ${currentDelay}ms... Erreur: ${error.message}`);
      await delay(currentDelay);
      currentDelay *= 2; // Backoff exponentiel
    }
  }
  throw new Error("Nombre maximal de tentatives de relance dépassé sans succès.");
}


export const verifyApiKey = async (): Promise<{isValid: boolean, message?: string}> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return { isValid: false, message: ENV_API_KEY_MISSING_ERROR };
    }
    // Attempt to initialize the client. This is the main check.
    getAIClient(); 
    // Pour une vérification plus approfondie, un appel léger à l'API peut être effectué, mais cela consomme du quota.
    // Pour l'instant, le succès de l'initialisation du client est le principal critère.
    // Exemple d'appel de test (peut être décommenté pour des tests plus poussés) :
    // const client = getAIClient();
    // await client.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: {parts: [{text: "Test"}]} });
    return { isValid: true };
  } catch (error: any) {
    console.error("La vérification de la clé API a échoué:", error);
    ai = null; // Réinitialiser le client en cas d'échec
    if (error.message === ENV_API_KEY_MISSING_ERROR || error.message.startsWith(API_CLIENT_INIT_ERROR.substring(0,10))) {
        return { isValid: false, message: error.message };
    }
    // Tenter de deviner s'il s'agit d'une clé invalide basée sur le message d'erreur typique de l'API
    if (error.message && (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("PERMISSION_DENIED"))) {
      return { isValid: false, message: API_KEY_INVALID_ERROR };
    }
    return { isValid: false, message: `${API_KEY_INVALID_ERROR} Détails: ${error.message || 'Erreur inconnue lors de la vérification.'}` };
  }
};


const parseJsonFromGeminiResponse = <T,>(textResponse: string): T | null => {
  let jsonStr = textResponse.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Échec de l'analyse de la réponse JSON:", e, "Réponse brute:", textResponse);
    return null;
  }
};


export const fetchTrendingTopics = async (agentMode: string, agentStyle: string, numSuggestions: number = 5): Promise<TrendingTopicsAnalysis | null> => {
  const client = getAIClient();
  const exampleStructure: TrendingTopicsAnalysis = {
    suggested_topics: ["Exemple de Sujet Tendance Un", "Exemple de Sujet Tendance Deux"],
    ai_chosen_topic: { topic: "Exemple de Sujet Tendance Un", reasoning: "Ce sujet correspond le mieux à la stratégie actuelle car il est très engageant." }
  };

  const prompt = `
    Vous êtes un Analyste de Tendances IA pour TikTok. Votre tâche est d'identifier ${numSuggestions} sujets tendance ou idées de contenu appropriés pour TikTok, en FRANÇAIS.
    Analysez également ces sujets et sélectionnez-en UN comme "ai_chosen_topic" que vous estimez le plus prometteur en fonction du style stratégique de l'agent. Fournissez un bref "reasoning" (en français) pour ce choix.
    
    Considérez les paramètres actuels de l'agent :
    - Mode d'Interaction : ${agentMode}
    - Style Stratégique : ${agentStyle}
    ${agentStyle === AgentStrategicStyle.BUZZ_MAXIMAL_AUDACIEUX ? "Pour le style BUZZ_MAXIMAL_AUDACIEUX, le sujet choisi doit fortement privilégier le contenu polarisant, très débattu ou audacieux pouvant générer une discussion importante. Soyez audacieux dans votre choix et votre raisonnement." : "Pour le style ENGAGEMENT_EQUILIBRE, le sujet choisi doit privilégier un large attrait, la positivité ou l'informativité, visant un engagement équilibré. Votre raisonnement doit refléter cela."}
    
    Fournissez votre sortie sous forme d'un unique objet JSON correspondant à cette structure (les clés JSON en anglais, les valeurs en français) :
    ${JSON.stringify(exampleStructure, null, 2)}
    
    Si aucun sujet n'est trouvé, retournez un tableau suggested_topics vide et omettez ai_chosen_topic.
    Assurez-vous que 'suggested_topics' contienne ${numSuggestions} éléments si possible.
    Le 'ai_chosen_topic' est optionnel si aucun choix approprié ne peut être fait, mais efforcez-vous de faire une sélection.

    Produisez UNIQUEMENT l'objet JSON. N'incluez aucun autre texte, explication ou formatage markdown.
  `;

  try {
    const requestParams: GenerateContentParameters = { 
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    };
    const response = await retryableApiCall((params) => client.models.generateContent(params), requestParams);
    
    const analysis = parseJsonFromGeminiResponse<TrendingTopicsAnalysis>(response.text);
    if (analysis && !analysis.suggested_topics) { 
        analysis.suggested_topics = [];
    }
    return analysis || { suggested_topics: [] };
  } catch (error) {
    console.error("Erreur lors de la récupération des sujets tendance:", error);
    throw error; 
  }
};

export const generateTikTokScript = async (
  topic: string, 
  agentMode: string, 
  agentStyle: string, 
  audacityLevel: number = 5, 
  userFeedback: string | null = null,
  topicRefinement: string | null = null
): Promise<ScriptData | null> => {
  const client = getAIClient();
  const scriptStructureExample: ScriptData = {
    title: "Titre d'Exemple Vidéo",
    target_audience: "ex: Jeunes de dix-huit à vingt-cinq ans",
    overall_mood: "ex: Drôle et léger",
    keywords: ["motcléUn", "motcléDeux", "motcléTrois"],
    hook_suggestion: "Accroche super percutante pour les trois premières secondes.",
    cta_suggestion: "Appel à l'action simple : Abonne-toi maintenant !",
    full_text_for_voiceover: "Bonjour à tous ! Aujourd'hui, on parle du sujet numéro un pour faire le buzz. C'est cent pour cent incroyable. Rendez-vous à quatorze heures pour plus de détails et cetera.",
    segments: [
      { scene: 1, visual_description: "Visuels dynamiques pour la première scène", dialogue_voiceover: "Salut tout le monde, c'est parti pour une nouvelle vidéo !", duration_seconds: 5 },
      { scene: 2, visual_description: "Démonstration rapide du produit ou de l'idée", dialogue_voiceover: "Regardez ça, c'est super simple et ça marche à tous les coups, environ quatre-vingt-dix-neuf pour cent du temps.", duration_seconds: 10 },
    ]
  };
  
  const prompt = `
    Vous êtes un Scénariste IA pour TikTok, chargé de créer un script vidéo viral en FRANÇAIS.
    Sujet de Base : ${topic}
    ${topicRefinement ? `Mots-clés/Phrase d'Affinement du Sujet par l'Utilisateur (se concentrer sur cet angle spécifique) : "${topicRefinement}"` : ""}
    Mode d'Interaction de l'Agent : ${agentMode}
    Style Stratégique de l'Agent : ${agentStyle}
    ${agentStyle === AgentStrategicStyle.BUZZ_MAXIMAL_AUDACIEUX ? `Niveau d'Audace (1-10, 10 étant le plus audacieux) : ${audacityLevel}. Cela signifie que le script doit être plus osé, controversé ou accrocheur.` : ""}
    ${userFeedback ? `Intégrez ce feedback utilisateur pour la révision : "${userFeedback}"` : ""}

    La vidéo doit être courte, engageante et optimisée pour TikTok (généralement 15-60 secondes au total).
    Tous les éléments textuels du script (titre, descriptions, dialogues, etc.) doivent être en FRANÇAIS.
    
    IMPORTANT POUR LA VOIX OFF (CHAMPS 'dialogue_voiceover' ET 'full_text_for_voiceover') :
    - Le texte DOIT être écrit pour une lecture orale FACILE et FLUIDE par un acteur vocal.
    - Privilégiez une écriture qui se rapproche de la PRONONCIATION orale naturelle en français.
    - ÉVITEZ les symboles, chiffres et abréviations. ÉCRIVEZ TOUT EN TOUTES LETTRES.
        Exemples :
        "pour cent" au lieu de "%"
        "numéro un" au lieu de "n°1" ou "#1"
        "hashtag TikTok" au lieu de "#TikTok"
        "et cetera" au lieu de "etc." ou "&c."
        "vingt-cinq" au lieu de "25"
        "trois" au lieu de "3"
        "quatorze heures" au lieu de "14h"
        "c'est-à-dire" au lieu de "c-à-d"
    - Pour le son "é" (comme dans "été" ou "parler"), utilisez la graphie "é" ou "er" ou "ez" comme en français standard, mais assurez-vous que le mot choisi est simple à prononcer. Évitez les graphies complexes si une alternative plus simple existe pour la lecture orale. Par exemple, si une phrase est ambiguë, reformulez-la pour clarté orale.
    - Le ton doit être conversationnel et adapté à une narration dynamique pour TikTok.
    - Le texte doit être phonétiquement clair, sans ambiguïté pour une personne lisant à haute voix.

    Veuillez générer un script au format JSON correspondant à cette structure (les clés JSON en anglais, les valeurs en français en respectant les consignes pour la voix off) :
    ${JSON.stringify(scriptStructureExample, null, 2)}

    Assurez-vous que :
    - La sortie est un unique objet JSON valide.
    - 'full_text_for_voiceover' est une concaténation de tous les 'dialogue_voiceover' des segments, formant un récit cohérent, et respecte les consignes pour la voix off.
    - 'dialogue_voiceover' dans chaque segment respecte les consignes pour la voix off.
    - La liste 'segments' décrit des scènes ou des parties distinctes de la vidéo.
    - 'visual_description' donne des idées claires de visuels pour chaque segment (ce champ n'a pas besoin de suivre les règles d'oralisation).
    - 'duration_seconds' pour chaque segment est réaliste pour TikTok. La durée totale doit être raisonnable.
    - Toutes les valeurs de type chaîne de caractères dans le JSON sont correctement échappées si elles contiennent des caractères spéciaux.
    - Il n'y a pas de caractères superflus, de commentaires ou de texte en dehors de la structure JSON elle-même.

    Produisez UNIQUEMENT l'objet JSON brut. Ne l'encapsulez pas dans du markdown (par exemple, \`\`\`json ... \`\`\`) et n'incluez aucun texte conversationnel avant ou après le JSON.
  `;
  
  try {
    const requestParams: GenerateContentParameters = { 
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    };
    const response = await retryableApiCall((params) => client.models.generateContent(params), requestParams);
    return parseJsonFromGeminiResponse<ScriptData>(response.text);
  } catch (error) {
    console.error("Erreur lors de la génération du script:", error);
    throw error;
  }
};

export const generateVisualsForScript = async (
  scriptSegments: ScriptSegment[], 
  agentStyle: string,
  overallMood: string,
  targetAudience: string,
  signal?: AbortSignal, 
  onProgressDetail?: (detail: string | null) => void 
): Promise<GeneratedImage[]> => {
  const client = getAIClient();
  const generatedImages: GeneratedImage[] = [];

  const segmentsToVisualize = scriptSegments.slice(0, MAX_SEGMENTS_FOR_VISUALS);
  const totalImagesToGenerate = segmentsToVisualize.length * IMAGES_PER_SEGMENT;
  let imagesGeneratedCount = 0;

  for (const segment of segmentsToVisualize) {
    for (let i = 0; i < IMAGES_PER_SEGMENT; i++) {
      if (signal?.aborted) {
        console.log("Génération de visuels annulée par le signal.");
        throw new DOMException('Génération annulée par l\'utilisateur.', 'AbortError');
      }

      imagesGeneratedCount++;
      if (onProgressDetail) {
        onProgressDetail(`Génération image ${imagesGeneratedCount}/${totalImagesToGenerate} pour scène ${segment.scene}...`);
      }

      let visualPrompt = `Image clé pour une vidéo TikTok.
Scène ${segment.scene}: ${segment.visual_description}.
Dialogue (pour contexte, pas pour inclusion dans l'image): "${segment.dialogue_voiceover}".
Ambiance générale: ${overallMood}.
Public cible: ${targetAudience}.`;

      if (agentStyle === AgentStrategicStyle.BUZZ_MAXIMAL_AUDACIEUX) {
        visualPrompt += " Style: accrocheur, audacieux, non conventionnel, très partageable, potentiel viral.";
      } else {
        visualPrompt += " Style: engageant, clair, attrayant, équilibré pour un large engagement, haute qualité.";
      }
      visualPrompt += " Format d'image 9:16 (vidéo verticale). Ceci est une seule image clé représentant ce moment dans la vidéo.";
      if (IMAGES_PER_SEGMENT > 1) {
        visualPrompt += ` (Image ${i + 1} sur ${IMAGES_PER_SEGMENT} pour cette scène).`;
      }
      
      try {
        if (signal?.aborted) {
            throw new DOMException('Génération annulée avant l\'appel API.', 'AbortError');
        }
        const requestParams: GenerateImagesParameters = {
          model: GEMINI_IMAGE_MODEL,
          prompt: visualPrompt, 
          config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        };
        const imageResponse = await retryableApiCall(
          (params) => client.models.generateImages(params), 
          requestParams,
          signal
        );

        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
          const base64Data = imageResponse.generatedImages[0].image.imageBytes;
          generatedImages.push({
            id: `img_s${segment.scene}_${Date.now()}_${i}`,
            prompt: visualPrompt,
            base64Data: base64Data,
            segmentScene: segment.scene,
          });
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.info("Génération d'image annulée pour la scène " + segment.scene);
            throw error; 
        }
        console.error(`Erreur lors de la génération du visuel pour le segment ${segment.scene}, image clé ${i + 1} (après tentatives de relance) :`, error);
        throw error; 
      }
    }
  }
  if (onProgressDetail) {
    onProgressDetail(null); 
  }
  return generatedImages;
};


export const generatePublishingSuggestions = async (videoTopic: string, scriptKeywords: string[]): Promise<PublishingSuggestions | null> => {
  const client = getAIClient();
  const suggestionsStructureExample: PublishingSuggestions = {
    hashtags: ["#pourtoi", "#tiktokviral", "#sujetSpecifiqueEnFrancais"],
    optimal_posting_time: "ex: En semaine de dix-huit heures à vingt-et-une heures, Weekends de midi à quinze heures (heure locale)",
    caption_ideas: ["Première idée de légende courte et engageante.", "Une autre idée de légende avec une question pour interagir."],
    engagement_tips: ["Posez une question dans votre légende pour susciter des commentaires.", "Utilisez des sons tendance si cela correspond à votre contenu.", "Répondez rapidement et de manière authentique aux commentaires."]
  };

  const prompt = `
    Vous êtes un Stratège de Publication IA pour TikTok.
    La vidéo porte sur : "${videoTopic}" (en français)
    Mots-clés principaux du script : ${scriptKeywords.join(", ")} (en français)

    Fournissez des suggestions de publication en FRANÇAIS pour maximiser la viralité et l'engagement sur TikTok.
    Formatez votre réponse en tant qu'objet JSON correspondant à cette structure (clés JSON en anglais, valeurs en français) :
    ${JSON.stringify(suggestionsStructureExample, null, 2)}

    Assurez-vous que les hashtags sont pertinents et incluent un mélange de tags larges et de niche.
    L'heure de publication optimale doit être une indication générale.
    Les idées de légendes doivent être concises et accrocheuses.
    Les conseils d'engagement doivent être actionnables.

    Produisez UNIQUEMENT l'objet JSON. N'incluez aucun autre texte, explication ou formatage markdown.
  `;

  try {
     const requestParams: GenerateContentParameters = { 
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    };
    const response = await retryableApiCall((params) => client.models.generateContent(params), requestParams);
    return parseJsonFromGeminiResponse<PublishingSuggestions>(response.text);
  } catch (error) {
    console.error("Erreur lors de la génération des suggestions de publication:", error);
    throw error;
  }
};

export const generateVoiceOverPlaceholder = (scriptFullText: string, mood: string): VoiceOverPlaceholder => {
  console.warn("Les suggestions de voix off sont des placeholders. La génération réelle de voix nécessite des API de synthèse vocale.");
  let styleSuggestion = "Voix standard claire et engageante.";
  if (mood.toLowerCase().includes("drôle") || mood.toLowerCase().includes("humour")) {
    styleSuggestion = "Voix enjouée, ludique, potentiellement avec un timing comique.";
  } else if (mood.toLowerCase().includes("inspirant") || mood.toLowerCase().includes("motivation")) {
    styleSuggestion = "Voix chaleureuse, encourageante et confiante.";
  } else if (mood.toLowerCase().includes("audacieux") || mood.toLowerCase().includes("osé")) {
    styleSuggestion = "Voix forte, affirmée et qui capte l'attention.";
  }
  
  const firstSentence = scriptFullText.split(/[.!?]+/)[0] || "Ceci est un exemple de phrase pour la voix off";
  return {
    styleSuggestion: styleSuggestion,
    sampleCue: `Exemple de phrase : "${firstSentence.trim()}${firstSentence.trim().match(/[.!?]$/) ? '' : '.'}" (À dire dans le style suggéré).`
  };
};

export const generateMusicPlaceholder = (mood: string, agentStyle: AgentStrategicStyle): MusicPlaceholder => {
  console.warn("Les suggestions de musique sont des placeholders. La sélection/génération réelle de musique nécessite des API ou bibliothèques musicales.");
  let style = "Musique de fond correspondant à l'ambiance.";
  let genre = "Instrumental";

  if (mood.toLowerCase().includes("drôle")) {
    genre = "Instrumental excentrique, léger, potentiellement avec des effets sonores.";
  } else if (mood.toLowerCase().includes("inspirant")) {
    genre = "Musique orchestrale ou électronique ambiante inspirante.";
  } else if (mood.toLowerCase().includes("suspens")) {
    genre = "Musique électronique atmosphérique tendue ou partition cinématique.";
  } else if (mood.toLowerCase().includes("éducatif")) {
     genre = "Musique de fond neutre et positive (par exemple : lo-fi, acoustique).";
  }

  if (agentStyle === AgentStrategicStyle.BUZZ_MAXIMAL_AUDACIEUX) {
    style = `Son haute énergie, possiblement tendance ou piste ${genre.toLowerCase()} audacieuse.`;
  } else {
    style = `Piste ${genre.toLowerCase()} engageante qui complète le contenu sans le dominer.`;
  }
  
  return {
    styleSuggestion: style,
    moodAlignment: `Choisie pour s'aligner avec l'ambiance du script : "${mood}".`
  };
};

export const generateSubtitlesPlaceholder = (scriptSegments: ScriptSegment[]): string => {
  console.warn("Le contenu SRT est un placeholder simplifié. La génération réelle de sous-titres nécessite la reconnaissance vocale et le formatage.");
  let srtContent = "";
  let currentTimeSeconds = 0;

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  scriptSegments.forEach((segment, index) => {
    const startTime = currentTimeSeconds;
    const endTime = currentTimeSeconds + segment.duration_seconds;
    srtContent += `${index + 1}\n`;
    srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    srtContent += `${segment.dialogue_voiceover}\n\n`;
    currentTimeSeconds = endTime;
  });

  return srtContent.trim();
};