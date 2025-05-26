

export enum AgentInteractionMode {
  PILOTE_AUTOMATIQUE_INTEGRAL = "PILOTE_AUTOMATIQUE_INTEGRAL", // L'IA prend toutes les décisions
  CO_PILOTE_CREATIF = "CO_PILOTE_CREATIF", // L'utilisateur guide l'IA
}

export enum AgentStrategicStyle {
  ENGAGEMENT_EQUILIBRE = "ENGAGEMENT_EQUILIBRE", // Vise un engagement large et positif
  BUZZ_MAXIMAL_AUDACIEUX = "BUZZ_MAXIMAL_AUDACIEUX", // Vise le buzz, contenu plus osé
}

export interface ScriptSegment {
  scene: number;
  visual_description: string; // Description textuelle des visuels pour la scène
  dialogue_voiceover: string; // Dialogue ou voix off pour la scène
  duration_seconds: number; // Durée de la scène en secondes
}

export interface ScriptData {
  title: string; // Titre de la vidéo
  target_audience: string; // Public cible (ex: Jeunes Z, Gamers, Amateurs de cuisine)
  overall_mood: string; // Ambiance générale (ex: Drôle, Inspirant, Éducatif)
  keywords: string[]; // Mots-clés principaux
  segments: ScriptSegment[]; // Découpage de la vidéo en segments/scènes
  full_text_for_voiceover: string; // Texte complet pour la voix off
  hook_suggestion: string; // Suggestion d'accroche pour capter l'attention
  cta_suggestion: string; // Suggestion d'appel à l'action (Call To Action)
}

export interface PublishingSuggestions {
  hashtags: string[];
  optimal_posting_time: string; // Heure de publication optimale suggérée
  caption_ideas: string[]; // Idées de légendes pour la publication
  engagement_tips: string[]; // Conseils pour stimuler l'engagement
}

export interface GeneratedImage {
  id: string;
  prompt: string; // Le prompt utilisé pour générer l'image
  base64Data: string; // Données de l'image encodées en base64
  segmentScene: number; // Numéro de la scène associée à cette image (pour le storyboard)
}

export interface VoiceOverPlaceholder {
  styleSuggestion: string; // Suggestion de style pour la voix off (ex: Voix jeune et dynamique)
  sampleCue: string; // Exemple de phrase pour illustrer le style
}

export interface MusicPlaceholder {
  styleSuggestion: string; // Suggestion de style pour la musique (ex: Musique électronique entraînante)
  moodAlignment: string; // Comment la musique s'aligne avec l'ambiance du script
}

export interface AIChoice {
  topic: string; // Le sujet choisi par l'IA
  reasoning: string; // La justification du choix de l'IA
}

export interface TrendingTopicsAnalysis {
  suggested_topics: string[]; // Liste des sujets tendance suggérés
  ai_chosen_topic?: AIChoice; // Le sujet spécifiquement choisi et justifié par l'IA
}

export enum AppStage {
  INITIAL_CONFIG = "INITIAL_CONFIG", // Configuration initiale de l'agent
  TREND_ANALYSIS_PENDING = "TREND_ANALYSIS_PENDING", // Analyse des tendances en cours
  TREND_ANALYSIS_RESULTS = "TREND_ANALYSIS_RESULTS", // Résultats de l'analyse des tendances
  SCRIPT_GENERATION_PENDING = "SCRIPT_GENERATION_PENDING", // Génération du script en cours
  SCRIPT_GENERATION_RESULTS = "SCRIPT_GENERATION_RESULTS", // Script généré
  VISUAL_GENERATION_PENDING = "VISUAL_GENERATION_PENDING", // Génération des visuels (storyboard) en cours
  VISUAL_GENERATION_RESULTS = "VISUAL_GENERATION_RESULTS", // Visuels générés
  AUDIO_SUBTITLES_PENDING = "AUDIO_SUBTITLES_PENDING", // Planification audio et sous-titres en cours
  AUDIO_SUBTITLES_RESULTS = "AUDIO_SUBTITLES_RESULTS", // Plan audio et sous-titres
  VIDEO_PLANNING_PENDING = "VIDEO_PLANNING_PENDING", // Préparation du plan d'assemblage vidéo
  VIDEO_PLANNING_RESULTS = "VIDEO_PLANNING_RESULTS", // Plan d'assemblage vidéo prêt
  PUBLISHING_SUGGESTIONS_PENDING = "PUBLISHING_SUGGESTIONS_PENDING", // Génération des suggestions de publication en cours
  PUBLISHING_SUGGESTIONS_RESULTS = "PUBLISHING_SUGGESTIONS_RESULTS", // Suggestions de publication prêtes
  ERROR = "ERROR", // Erreur
}

export interface DynamicStoryboardPlaybackState {
  isPlaying: boolean; // Le storyboard est-il en cours de lecture ?
  currentSegmentIndex: number; // Index du segment actuellement affiché
  currentImageSubIndex: number; // Sous-index de l'image dans le segment (si plusieurs images par segment)
}

export interface AppState {
  stage: AppStage;
  agentMode: AgentInteractionMode;
  agentStyle: AgentStrategicStyle;
  audacityLevel: number; 
  customTopic: string; // Sujet personnalisé fourni par l'utilisateur
  apiKeyStatus: 'pending' | 'success' | 'error'; // Statut de la clé API
  
  trendingTopicsAnalysis: TrendingTopicsAnalysis | null;
  selectedTopic: string | null; // Sujet sélectionné (par l'utilisateur ou l'IA)
  userTopicRefinement: string; // Mots-clés de l'utilisateur pour affiner le sujet
  
  scriptData: ScriptData | null;
  userScriptFeedback: string; // Feedback de l'utilisateur sur le script généré

  generatedVisuals: GeneratedImage[]; // Images générées pour le storyboard
  
  voiceOverPlaceholder: VoiceOverPlaceholder | null;
  musicPlaceholder: MusicPlaceholder | null;
  generatedSrt: string | null; // Contenu SRT généré (pour les sous-titres)
  
  dynamicStoryboardState: DynamicStoryboardPlaybackState; // État du lecteur de storyboard dynamique

  publishingSuggestions: PublishingSuggestions | null;
  
  isLoading: boolean; // Indicateur de chargement général
  errorMessage: string | null; // Message d'erreur
  loadingMessageDetail: string | null; // Message détaillé pour l'indicateur de chargement
  
  // Ajout des nouvelles propriétés pour la modale Veed.io
  veedioPrompt: string | null; // Prompt généré pour Veed.io
  showVeedioPromptModal: boolean; // Contrôle l'affichage de la modale Veed.io
}