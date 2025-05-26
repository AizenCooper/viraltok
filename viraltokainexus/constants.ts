import { AgentInteractionMode, AgentStrategicStyle } from './types';

export const APP_TITLE = "ViralTok AI Nexus"; // Maintenu pour la marque, l'UI utilisera une version traduite si nécessaire

export const DEFAULT_AGENT_MODE = AgentInteractionMode.CO_PILOTE_CREATIF;
export const DEFAULT_AGENT_STYLE = AgentStrategicStyle.ENGAGEMENT_EQUILIBRE;
export const DEFAULT_AUDACITY_LEVEL = 5;

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002";

export const MAX_TRENDING_TOPICS_TO_SHOW = 5;

// Nouvelles constantes pour la génération de storyboard/images clés
export const MAX_SEGMENTS_FOR_VISUALS = 3; // Générer des visuels pour jusqu'aux 3 premiers segments
export const IMAGES_PER_SEGMENT = 1; // Générer 1 image clé par segment ciblé (peut être augmenté à 2 pour plus de détails)
