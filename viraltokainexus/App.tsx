
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    AgentInteractionMode, AgentStrategicStyle, AppStage, AppState, ScriptData, 
    PublishingSuggestions, GeneratedImage, VoiceOverPlaceholder, MusicPlaceholder, ScriptSegment,
    TrendingTopicsAnalysis, DynamicStoryboardPlaybackState
} from './types';
import { APP_TITLE, DEFAULT_AGENT_MODE, DEFAULT_AGENT_STYLE, DEFAULT_AUDACITY_LEVEL, MAX_TRENDING_TOPICS_TO_SHOW } from './constants';
import * as geminiService from './services/geminiService';
import { ENV_API_KEY_MISSING_ERROR, API_KEY_INVALID_ERROR, API_CLIENT_INIT_ERROR } from './services/geminiService';
import ControlsPanel from './components/ControlsPanel';
import LoadingIndicator from './components/LoadingIndicator';
import StepOutput from './components/StepOutput';
import GeneratedImageView from './components/GeneratedImageView';
import DynamicStoryboardPreview from './components/DynamicStoryboardPreview';
import Modal from './components/Modal'; // Importer le composant Modal


// Icônes
const TrendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10 3.5A1.5 1.5 0 0111.5 2h1A1.5 1.5 0 0114 3.5v1A1.5 1.5 0 0112.5 6h-1A1.5 1.5 0 0110 4.5v-1zM5.5 10A1.5 1.5 0 004 11.5v1A1.5 1.5 0 005.5 14h1A1.5 1.5 0 008 12.5v-1A1.5 1.5 0 006.5 10h-1zM10 14.5a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm8.293-2.707a1 1 0 00-1.414-1.414L15 12.172V9.5a1 1 0 00-2 0v4a1 1 0 001 1h4a1 1 0 000-2h-2.172l1.879-1.879z" /></svg>;
const ScriptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm5 2.25a.75.75 0 000 1.5h1.75a.75.75 0 000-1.5H9.5zm-3.5 4a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06l-.47-.47-1.418 1.417a.75.75 0 001.061 1.06l1.526-1.525.422-.422a.75.75 0 00-1.06-1.06l-3.604 3.603a.75.75 0 00-1.06 0l-1.147-1.147a.75.75 0 00-1.06 0L3.72 14.28A.75.75 0 003 14.75v.01zM3.25 4.5c-.414 0-.75.336-.75.75v4.069l2.22-2.219a.75.75 0 011.06 0l1.91 1.909-.47.47a.75.75 0 101.06 1.06l.47-.47 1.418-1.417a.75.75 0 011.061 0l3.494 3.493V5.25a.75.75 0 00-.75-.75H3.25z" clipRule="evenodd" /></svg>;
const AudioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M7.25 11.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM9.25 9.75a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zM11.25 8.25a.75.75 0 00-1.5 0v8.5a.75.75 0 001.5 0v-8.5zM13.25 11.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM5.25 7.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM15.25 7.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" /><path fillRule="evenodd" d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm3.25-1A1.25 1.25 0 004 5.25v9.5A1.25 1.25 0 005.25 16h9.5A1.25 1.25 0 0016 14.75v-9.5A1.25 1.25 0 0014.75 4h-9.5z" clipRule="evenodd" /></svg>;
const PublishIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const VideoPlanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-4.392A2.99 2.99 0 015 12.5h10a2.99 2.99 0 011.5 0V17.25a.75.75 0 001.5 0V2.75a.75.75 0 00-1.5 0v4.392c-.01.004-.018.008-.027.012A2.991 2.991 0 0015 7.5H5a2.991 2.991 0 00-1.473-.346A2.99 2.99 0 013.5 7.142V2.75zM15 9H5a1.5 1.5 0 00-1.5 1.5v.5h13v-.5A1.5 1.5 0 0015 9z" /></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.121A1.5 1.5 0 0117 6.621V16.5A1.5 1.5 0 0115.5 18H8.5A1.5 1.5 0 017 16.5v-13z" /><path d="M5 6.5A1.5 1.5 0 016.5 5h3A1.5 1.5 0 0111 6.5V15A1.5 1.5 0 019.5 16.5h-3A1.5 1.5 0 015 15V6.5z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>;


const initialState: AppState = {
  stage: AppStage.INITIAL_CONFIG,
  agentMode: DEFAULT_AGENT_MODE,
  agentStyle: DEFAULT_AGENT_STYLE,
  audacityLevel: DEFAULT_AUDACITY_LEVEL,
  customTopic: '',
  apiKeyStatus: 'pending',
  trendingTopicsAnalysis: null,
  selectedTopic: null,
  userTopicRefinement: '',
  scriptData: null,
  userScriptFeedback: '',
  generatedVisuals: [],
  voiceOverPlaceholder: null,
  musicPlaceholder: null,
  generatedSrt: null,
  dynamicStoryboardState: {
    isPlaying: false,
    currentSegmentIndex: 0,
    currentImageSubIndex: 0,
  },
  publishingSuggestions: null,
  isLoading: false,
  errorMessage: null,
  loadingMessageDetail: null,
  veedioPrompt: null,
  showVeedioPromptModal: false,
};

// Déclarations anticipées pour le chaînage
let executeScriptGenerationInternal: (topicOverride?: string, agentModeOverride?: AgentInteractionMode) => Promise<void>;
let executeVisualGenerationInternal: (scriptOverride: ScriptData, agentStyleOverride: AgentStrategicStyle, agentModeOverride?: AgentInteractionMode) => Promise<void>;
let executeAudioSubtitlesStepInternal: (scriptOverride: ScriptData, agentStyleOverride: AgentStrategicStyle, agentModeOverride?: AgentInteractionMode) => Promise<void>;
let executeVideoPlanningStepInternal: (agentModeOverride: AgentInteractionMode) => Promise<void>;
let executePublishingSuggestionsInternal: (keywordsOverride: string[], videoTopicOverride: string, agentModeOverride: AgentInteractionMode) => Promise<void>;


const App: React.FC = () => {
  const [state, setState] = useState<AppState>(initialState);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  // Déplacement des useMemo au niveau supérieur du composant App
  const visualsByScene_VisResults = useMemo(() => state.generatedVisuals.reduce((acc, img) => {
      acc[img.segmentScene] = acc[img.segmentScene] || [];
      acc[img.segmentScene].push(img);
      return acc;
  }, {} as Record<number, GeneratedImage[]>), [state.generatedVisuals]);

  const visualsByScene_PlanResults = useMemo(() => state.generatedVisuals.reduce((acc, img) => {
      acc[img.segmentScene] = acc[img.segmentScene] || [];
      acc[img.segmentScene].push(img);
      return acc;
  }, {} as Record<number, GeneratedImage[]>), [state.generatedVisuals]);


  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const apiKeyCheck = await geminiService.verifyApiKey();
        setState(prev => ({ ...prev, apiKeyStatus: apiKeyCheck.isValid ? 'success' : 'error' }));
        if(!apiKeyCheck.isValid) {
          setState(prev => ({...prev, stage: AppStage.ERROR, errorMessage: apiKeyCheck.message || ENV_API_KEY_MISSING_ERROR }));
        }
      } catch (e: any) {
        setState(prev => ({ ...prev, apiKeyStatus: 'error', stage: AppStage.ERROR, errorMessage: e.message || "Erreur inattendue lors de la vérification de la clé API." }));
      }
    };
    checkApiKey();
  }, []);

  const cancelCurrentOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log("Opération précédente annulée.");
    }
  },[]);

  const handleReset = useCallback(() => {
    cancelCurrentOperation();
    setState(prev => ({
      ...initialState, 
      apiKeyStatus: prev.apiKeyStatus, 
      errorMessage: prev.apiKeyStatus === 'error' ? prev.errorMessage : null, 
      stage: prev.apiKeyStatus === 'error' ? AppStage.ERROR : AppStage.INITIAL_CONFIG, 
      dynamicStoryboardState: {
          isPlaying: false,
          currentSegmentIndex: 0,
          currentImageSubIndex: 0,
      }
    }));
  }, [cancelCurrentOperation]);
  
  const handleError = useCallback((message: string, error?: any) => {
    console.error(message, error);
    
    let displayMessage = `${message}${error ? `: ${error.message || error}` : ''}`;
    if (error && error.name === 'AbortError') {
      displayMessage = "Opération annulée par l'utilisateur.";
    } else if (error && (error.status === 429 || (typeof error.message === 'string' && error.message.includes("429")))) {
      displayMessage = `Erreur de quota API (429) : ${error.message || 'Limite de requêtes atteinte.'} Veuillez vérifier votre plan API Google et vos quotas. Vous devrez peut-être attendre que votre quota se réinitialise ou passer à un plan supérieur.`;
    } else if (error && (error.status === 503 || (typeof error.message === 'string' && error.message.includes("503")))) {
      displayMessage = `Service API temporairement indisponible (503) : ${error.message || 'Le service est actuellement surchargé ou en maintenance.'} Veuillez réessayer plus tard. L'application a tenté plusieurs relances.`;
    } else if (error && (error.message === ENV_API_KEY_MISSING_ERROR || error.message.includes(API_CLIENT_INIT_ERROR.substring(0,10)) || error.message.includes(API_KEY_INVALID_ERROR.substring(0,10)))) {
      displayMessage = error.message; // Use the specific error message from geminiService
    }


    setState(prev => ({ 
        ...prev, 
        stage: AppStage.ERROR, 
        isLoading: false, 
        errorMessage: displayMessage,
        loadingMessageDetail: null,
        dynamicStoryboardState: { ...prev.dynamicStoryboardState, isPlaying: false } 
    }));
    abortControllerRef.current = null; 
  }, []);

  const executePublishingSuggestions = useCallback(async (
    keywordsOverride: string[], 
    videoTopicOverride: string,
    agentModeOverride?: AgentInteractionMode 
  ) => {
    cancelCurrentOperation();
    const topicToUse = videoTopicOverride || state.selectedTopic;
    const keywordsToUse = keywordsOverride || state.scriptData?.keywords;
    const currentAgentMode = agentModeOverride || state.agentMode;


    if (!topicToUse || !keywordsToUse) {
      handleError("Sujet ou mots-clés manquants pour les suggestions de publication.");
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, stage: AppStage.PUBLISHING_SUGGESTIONS_PENDING, errorMessage: null, loadingMessageDetail: "Optimisation de la stratégie de publication..." }));
    try {
      const suggestions = await geminiService.generatePublishingSuggestions(topicToUse, keywordsToUse);
      setState(prev => ({ 
        ...prev, 
        isLoading: currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL ? false : prev.isLoading, 
        publishingSuggestions: suggestions, 
        stage: AppStage.PUBLISHING_SUGGESTIONS_RESULTS,
        loadingMessageDetail: null, 
      }));
       if (currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
        setState(prev => ({ ...prev, isLoading: false })); 
      }
    } catch (error) {
      handleError("Échec de l'obtention des suggestions de publication", error);
    }
  }, [state.selectedTopic, state.scriptData?.keywords, state.agentMode, handleError, cancelCurrentOperation]);
  executePublishingSuggestionsInternal = executePublishingSuggestions;

  const executeVideoPlanningStep = useCallback(async (
      agentModeOverride?: AgentInteractionMode
  ) => {
      cancelCurrentOperation();
      const currentAgentMode = agentModeOverride || state.agentMode;
      setState(prev => ({ ...prev, isLoading: true, stage: AppStage.VIDEO_PLANNING_PENDING, errorMessage: null, loadingMessageDetail: "Préparation du plan d'assemblage vidéo..." }));
      
      await new Promise(resolve => setTimeout(resolve, 300)); 

      setState(prev => ({
          ...prev,
          isLoading: currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL, 
          stage: AppStage.VIDEO_PLANNING_RESULTS,
          loadingMessageDetail: currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL ? prev.loadingMessageDetail : null,
          dynamicStoryboardState: { 
            isPlaying: false,
            currentSegmentIndex: 0,
            currentImageSubIndex: 0,
          }
      }));

      if (currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
          if (state.scriptData?.keywords && state.selectedTopic) {
            setTimeout(() => executePublishingSuggestionsInternal(state.scriptData!.keywords, state.selectedTopic!, currentAgentMode), 50);
          } else {
            handleError("Données manquantes pour les suggestions de publication en mode auto après la planification vidéo.");
          }
      }
  }, [state.agentMode, state.scriptData, state.selectedTopic, handleError, cancelCurrentOperation]);
  executeVideoPlanningStepInternal = executeVideoPlanningStep;


  const executeAudioSubtitlesStep = useCallback(async (
    scriptOverride: ScriptData,
    agentStyleOverride: AgentStrategicStyle,
    agentModeOverride?: AgentInteractionMode
  ) => {
    cancelCurrentOperation();
    const currentAgentMode = agentModeOverride || state.agentMode;
    const scriptToUse = scriptOverride || state.scriptData;
    const currentAgentStyle = agentStyleOverride || state.agentStyle;


    if (!scriptToUse) {
      handleError("Aucune donnée de script pour la planification audio/sous-titres.");
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, stage: AppStage.AUDIO_SUBTITLES_PENDING, errorMessage: null, loadingMessageDetail: "Planification de l'audio & des sous-titres..." }));
    
    try {
      const voiceOver = geminiService.generateVoiceOverPlaceholder(scriptToUse.full_text_for_voiceover, scriptToUse.overall_mood);
      const music = geminiService.generateMusicPlaceholder(scriptToUse.overall_mood, currentAgentStyle);
      const srt = geminiService.generateSubtitlesPlaceholder(scriptToUse.segments);
      
      await new Promise(resolve => setTimeout(resolve, 500)); 

      setState(prev => ({ 
        ...prev,
        voiceOverPlaceholder: voiceOver,
        musicPlaceholder: music,
        generatedSrt: srt,
        loadingMessageDetail: currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL ? prev.loadingMessageDetail : null,
      }));

      if (currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
        setState(prev => ({ ...prev, isLoading: true })); 
        executeVideoPlanningStepInternal(currentAgentMode);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          stage: AppStage.AUDIO_SUBTITLES_RESULTS,
          loadingMessageDetail: null,
        }));
      }
    } catch (error) {
        handleError("Échec de la planification audio/sous-titres", error);
    }
  }, [state.scriptData, state.agentStyle, state.agentMode, handleError, cancelCurrentOperation]);
  executeAudioSubtitlesStepInternal = executeAudioSubtitlesStep;

  const executeVisualGeneration = useCallback(async (
    scriptOverride: ScriptData, 
    agentStyleOverride: AgentStrategicStyle,
    agentModeOverride?: AgentInteractionMode
  ) => {
    cancelCurrentOperation(); 
    const newAbortController = new AbortController();
    abortControllerRef.current = newAbortController; 
    const signal = newAbortController.signal;


    const currentAgentMode = agentModeOverride || state.agentMode;
    const scriptToUse = scriptOverride || state.scriptData;
    const currentAgentStyle = agentStyleOverride || state.agentStyle;

    if (!scriptToUse || !scriptToUse.segments || scriptToUse.segments.length === 0) {
      handleError("Aucune donnée de script ou segment disponible pour la génération de visuels.");
      if (currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
        console.warn("Mode auto : Aucun segment pour les visuels, tentative de passage à la planification audio/sous-titres.");
        executeAudioSubtitlesStepInternal(scriptToUse, currentAgentStyle, currentAgentMode);
      }
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, stage: AppStage.VISUAL_GENERATION_PENDING, errorMessage: null, generatedVisuals: [], loadingMessageDetail: "Génération d'images clés pour le storyboard..."}));
    
    let images: GeneratedImage[] = [];
    try {
      images = await geminiService.generateVisualsForScript(
        scriptToUse.segments, 
        currentAgentStyle,
        scriptToUse.overall_mood,
        scriptToUse.target_audience,
        signal,
        (detail: string | null) => setState(prev => ({ ...prev, loadingMessageDetail: detail })) 
      );
      
      if (!signal.aborted) {
        abortControllerRef.current = null; 
      }
      
      setState(prev => ({ 
        ...prev, 
        generatedVisuals: images,
        loadingMessageDetail: currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL ? prev.loadingMessageDetail : null,
      }));

      if (currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
        if (!signal.aborted) { 
            setState(prev => ({ ...prev, isLoading: true })); 
            executeAudioSubtitlesStepInternal(scriptToUse, currentAgentStyle, currentAgentMode);
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false, stage: AppStage.VISUAL_GENERATION_RESULTS, loadingMessageDetail: null }));
      }
    } catch (error) {
      if (!signal.aborted) { 
        handleError("Échec de la génération des visuels", error);
      } else { 
          console.log("Génération de visuels annulée par l'utilisateur.");
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            stage: AppStage.SCRIPT_GENERATION_RESULTS, 
            loadingMessageDetail: null,
            generatedVisuals: images.length > 0 ? images : prev.generatedVisuals 
          })); 
      }
    } finally {
        if (abortControllerRef.current === newAbortController && !newAbortController.signal.aborted) {
             abortControllerRef.current = null;
        }
    }
  }, [state.scriptData, state.agentStyle, state.agentMode, handleError, cancelCurrentOperation]);
  executeVisualGenerationInternal = executeVisualGeneration;
  
  const executeScriptGeneration = useCallback(async (
    topicOverride?: string,
    agentModeOverride?: AgentInteractionMode
  ) => {
    cancelCurrentOperation();
    const currentAgentMode = agentModeOverride || state.agentMode;
    const topicToUse = topicOverride || state.selectedTopic;

    if (!topicToUse) {
      handleError("Aucun sujet sélectionné pour la génération du script.");
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, stage: AppStage.SCRIPT_GENERATION_PENDING, errorMessage: null, selectedTopic: topicToUse, loadingMessageDetail: `Création du script pour "${topicToUse}"...` }));
    try {
      const script = await geminiService.generateTikTokScript(
          topicToUse, 
          currentAgentMode, 
          state.agentStyle, 
          state.audacityLevel, 
          state.userScriptFeedback || null,
          state.userTopicRefinement || null 
      );
      if (!script) {
        handleError("La génération du script a échoué ou n'a retourné aucune donnée.");
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        scriptData: script, 
        userScriptFeedback: '', 
        userTopicRefinement: '', 
        loadingMessageDetail: currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL ? prev.loadingMessageDetail : null,
      }));

      if (currentAgentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
        setState(prev => ({ ...prev, isLoading: true })); 
        executeVisualGenerationInternal(script, state.agentStyle, currentAgentMode);
      } else {
        setState(prev => ({ ...prev, isLoading: false, stage: AppStage.SCRIPT_GENERATION_RESULTS, loadingMessageDetail: null }));
      }
    } catch (error) {
      handleError("Échec de la génération du script", error);
    }
  }, [state.selectedTopic, state.agentMode, state.agentStyle, state.audacityLevel, state.userScriptFeedback, state.userTopicRefinement, handleError, cancelCurrentOperation]);
  executeScriptGenerationInternal = executeScriptGeneration;

  const executeTrendAnalysis = useCallback(async () => {
    cancelCurrentOperation();
    setState(prev => ({ ...prev, isLoading: true, stage: AppStage.TREND_ANALYSIS_PENDING, errorMessage: null, userTopicRefinement: '', loadingMessageDetail: "Analyse des dernières tendances TikTok & sélection du meilleur sujet..." }));
    try {
      const analysis = await geminiService.fetchTrendingTopics(state.agentMode, state.agentStyle, MAX_TRENDING_TOPICS_TO_SHOW);
      
      let autoSelectedTopic: string | null = null;
      if (analysis && state.agentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL) {
        if (analysis.ai_chosen_topic?.topic) {
          autoSelectedTopic = analysis.ai_chosen_topic.topic;
        } else if (analysis.suggested_topics.length > 0) {
          autoSelectedTopic = analysis.suggested_topics[0]; 
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false, 
            stage: AppStage.TREND_ANALYSIS_RESULTS, 
            trendingTopicsAnalysis: analysis || {suggested_topics:[]}, 
            errorMessage: "L'IA n'a pu identifier aucun sujet tendance en mode automatique. Veuillez essayer en mode Co-Pilote ou fournir un sujet personnalisé.",
            loadingMessageDetail: null
          }));
          return; 
        }
      }

      setState(prev => ({ 
          ...prev, 
          trendingTopicsAnalysis: analysis, 
          selectedTopic: autoSelectedTopic || prev.selectedTopic, 
          errorMessage: null, 
          loadingMessageDetail: autoSelectedTopic ? prev.loadingMessageDetail : null,
      }));
      
      if (autoSelectedTopic) {
        setState(prev => ({ ...prev, isLoading: true })); 
        executeScriptGenerationInternal(autoSelectedTopic, state.agentMode);
      } else {
        setState(prev => ({ ...prev, isLoading: false, stage: AppStage.TREND_ANALYSIS_RESULTS, loadingMessageDetail: null }));
      }
    } catch (error) {
      handleError("Échec de la récupération des sujets tendance", error);
    }
  }, [state.agentMode, state.agentStyle, handleError, cancelCurrentOperation]);


  const handleNextStep = useCallback(() => {
    if (state.isLoading && state.apiKeyStatus === 'success') {
        console.warn("Opération déjà en cours, veuillez patienter.");
        return;
    }
    if (state.apiKeyStatus !== 'success') {
        handleError(state.errorMessage || ENV_API_KEY_MISSING_ERROR);
        return;
    }
    
    cancelCurrentOperation();


    switch (state.stage) {
      case AppStage.INITIAL_CONFIG:
        if (state.customTopic) { 
            executeScriptGenerationInternal(state.customTopic, state.agentMode); 
        } else {
            executeTrendAnalysis();
        }
        break;
      
      case AppStage.TREND_ANALYSIS_RESULTS:
        if (state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF) {
          if (!state.selectedTopic) {
            handleError("Veuillez sélectionner un sujet pour continuer.");
            return;
          }
          executeScriptGenerationInternal(state.selectedTopic);
        }
        break;
      case AppStage.SCRIPT_GENERATION_RESULTS:
        if (state.scriptData) {
            executeVisualGenerationInternal(state.scriptData, state.agentStyle, state.agentMode);
        } else {
            handleError("Aucune donnée de script pour générer des visuels.");
        }
        break;
      case AppStage.VISUAL_GENERATION_RESULTS:
         if (state.scriptData) {
            executeAudioSubtitlesStepInternal(state.scriptData, state.agentStyle, state.agentMode);
        } else {
            handleError("Aucune donnée de script pour la planification audio/sous-titres.");
        }
        break;
      case AppStage.AUDIO_SUBTITLES_RESULTS:
         executeVideoPlanningStepInternal(state.agentMode);
        break;
      case AppStage.VIDEO_PLANNING_RESULTS:
         if (state.scriptData && state.scriptData.keywords && state.selectedTopic) {
            executePublishingSuggestionsInternal(state.scriptData.keywords, state.selectedTopic, state.agentMode);
        } else {
            handleError("Données manquantes pour les suggestions de publication.");
        }
        break;
      default:
        console.log("Aucune action pour l'étape actuelle ou déjà à la fin.");
    }
  }, [state, handleError, executeScriptGenerationInternal, executeTrendAnalysis, executeVisualGenerationInternal, executeAudioSubtitlesStepInternal, executeVideoPlanningStepInternal, executePublishingSuggestionsInternal, cancelCurrentOperation]);

  const handleStoryboardPlayPause = useCallback(() => {
    setState(prev => ({
      ...prev,
      dynamicStoryboardState: {
        ...prev.dynamicStoryboardState,
        isPlaying: !prev.dynamicStoryboardState.isPlaying,
      }
    }));
  }, []);

  const handleStoryboardReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      dynamicStoryboardState: {
        isPlaying: false,
        currentSegmentIndex: 0,
        currentImageSubIndex: 0,
      }
    }));
  }, []);

  const handleStoryboardTick = useCallback((nextSegmentIndex: number, nextImageSubIndex: number) => {
    setState(prev => ({
      ...prev,
      dynamicStoryboardState: {
        ...prev.dynamicStoryboardState,
        currentSegmentIndex: nextSegmentIndex,
        currentImageSubIndex: nextImageSubIndex,
      }
    }));
  }, []);

  const handleGenerateVeedioPrompt = useCallback(() => {
    if (!state.scriptData) {
      handleError("Aucune donnée de script disponible pour générer le prompt Veed.io.");
      return;
    }

    const { title, target_audience, overall_mood, segments, hook_suggestion, cta_suggestion, keywords } = state.scriptData;
    const voiceStyle = state.voiceOverPlaceholder?.styleSuggestion || "Voix standard claire et engageante.";
    const voiceSample = state.voiceOverPlaceholder?.sampleCue || "";
    const musicStyle = state.musicPlaceholder?.styleSuggestion || "Musique de fond correspondant à l'ambiance.";
    const musicAlignment = state.musicPlaceholder?.moodAlignment || "";
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration_seconds, 0);

    let promptSegments = "";
    segments.forEach(segment => {
      let visualIdeas = "Aucune image clé spécifique générée par notre IA pour cette scène ; se baser sur la description visuelle ci-dessus.";
      const sceneVisuals = visualsByScene_PlanResults[segment.scene];
      if (sceneVisuals && sceneVisuals.length > 0) {
        visualIdeas = sceneVisuals.map((img, idx) => 
          `- Image Clé IA ${idx + 1}: ${img.prompt.substring(0,100)}... (Détails complets dans le prompt original de l'image)`
        ).join('\n          ');
      }

      promptSegments += `
    **SCÈNE ${segment.scene}:**
    *   **Durée:** ${segment.duration_seconds} secondes.
    *   **Description Visuelle (pour Veed.io):** ${segment.visual_description}.
    *   **Idées Visuelles Clés de notre IA (inspiration pour cette scène):**
          ${visualIdeas}
    *   **Dialogue (pour voix off et sous-titres):** "${segment.dialogue_voiceover}".
    ---`;
    });

    const veedioPromptContent = `---
**PROMPT DE PRODUCTION VIDÉO TIKTOK POUR VEED.IO (Généré par ViralTokAINexus)**

**Informations Générales sur la Vidéo:**
*   **Titre Proposé:** ${title}
*   **Public Cible Principal:** ${target_audience}
*   **Ambiance Générale Attendue:** ${overall_mood}
*   **Style de Voix Off (pour génération audio Veed.io):** ${voiceStyle} (${voiceSample})
*   **Style Musical de Fond (pour sélection Veed.io):** ${musicStyle} (${musicAlignment})
*   **Durée Totale Approximative:** ${totalDuration} secondes.

**Instructions Générales pour Veed.io (IA ou Éditeur Humain):**
1.  **Voix Off:** Générer une voix off en français (qualité premium si possible) basée sur le texte "Dialogue" fourni pour chaque scène.
2.  **Sous-titres:** Générer automatiquement des sous-titres en français, synchronisés avec la voix off. Style de sous-titres : clair, lisible, moderne, adapté à TikTok.
3.  **Visuels:** Pour chaque scène, utiliser la "Description Visuelle" pour choisir ou générer des clips vidéo ou images pertinents et dynamiques. Les "Idées Visuelles Clés de notre IA" sont des suggestions pour inspirer les visuels de cette scène.
4.  **Durées:** Respecter scrupuleusement la "Durée" indiquée pour chaque scène.
5.  **Transitions:** Utiliser des transitions rapides et engageantes entre les scènes.
6.  **Format:** Vidéo verticale (format 9:16).
7.  **Accroche & CTA:** Mettre en évidence l'accroche au début et l'appel à l'action à la fin, comme spécifié.

---

**DÉCOUPAGE DÉTAILLÉ SCÈNE PAR SCÈNE:**
${promptSegments}

**Éléments Clés du Scénario:**
*   **Accroche (Début Vidéo):** Utiliser l'accroche suivante pour démarrer la vidéo : "${hook_suggestion}".
*   **Appel à l'Action (Fin Vidéo):** Conclure avec l'appel à l'action : "${cta_suggestion}".

**Mots-Clés du Script (pour inspiration ou tags):**
*   ${keywords.join(', ')}

---
**FIN DU PROMPT POUR VEED.IO**`;

    setState(prev => ({
      ...prev,
      veedioPrompt: veedioPromptContent,
      showVeedioPromptModal: true,
    }));
    setPromptCopied(false); 
  }, [state.scriptData, state.generatedVisuals, state.voiceOverPlaceholder, state.musicPlaceholder, visualsByScene_PlanResults, handleError]);

  const handleCloseVeedioModal = useCallback(() => {
    setState(prev => ({ ...prev, showVeedioPromptModal: false, veedioPrompt: null }));
  }, []);

  const handleCopyVeedioPrompt = useCallback(() => {
    if (state.veedioPrompt) {
      navigator.clipboard.writeText(state.veedioPrompt)
        .then(() => {
          setPromptCopied(true);
          setTimeout(() => setPromptCopied(false), 2000); 
        })
        .catch(err => {
          console.error("Erreur lors de la copie du prompt : ", err);
          alert("Erreur lors de la copie. Veuillez copier manuellement.");
        });
    }
  }, [state.veedioPrompt]);
  
  const renderVideoPlanningResults = () => {
    return (
      <StepOutput title="Blueprint Complet de Production Vidéo par l'IA" icon={<VideoPlanIcon />}>
        {state.scriptData && (
          <div className="mb-8">
            <DynamicStoryboardPreview 
              scriptData={state.scriptData}
              visuals={state.generatedVisuals}
              isPlaying={state.dynamicStoryboardState.isPlaying}
              currentSegmentIndex={state.dynamicStoryboardState.currentSegmentIndex}
              currentImageSubIndex={state.dynamicStoryboardState.currentImageSubIndex}
              onPlayPause={handleStoryboardPlayPause}
              onReset={handleStoryboardReset}
              onTick={handleStoryboardTick}
            />
          </div>
        )}

        <div className="p-4 bg-slate-700/30 rounded-lg mb-6">
          {state.scriptData && (
            <div className="mb-4 border-b border-slate-600 pb-4">
              <h3 className="text-xl font-semibold text-sky-300 mb-2">Détails Clés de la Vidéo</h3>
              <p><strong>Titre :</strong> {state.scriptData.title}</p>
              <p><strong>Ambiance Générale :</strong> {state.scriptData.overall_mood}</p>
              <p><strong>Public Cible :</strong> {state.scriptData.target_audience}</p>
              <p><strong>Mots-clés :</strong> {state.scriptData.keywords.join(', ')}</p>
              <p><strong>Accroche :</strong> {state.scriptData.hook_suggestion}</p>
              <p><strong>CTA :</strong> {state.scriptData.cta_suggestion}</p>
            </div>
          )}

          {state.voiceOverPlaceholder && state.musicPlaceholder && (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-slate-700/50 rounded-md">
                <h3 className="text-lg font-semibold text-sky-300 mb-1">Plan Général Voix Off</h3>
                <p><strong>Style :</strong> {state.voiceOverPlaceholder.styleSuggestion}</p>
                <p className="text-xs mt-1"><em>Exemple : {state.voiceOverPlaceholder.sampleCue}</em></p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-md">
                <h3 className="text-lg font-semibold text-sky-300 mb-1">Plan Général Musique</h3>
                <p><strong>Style :</strong> {state.musicPlaceholder.styleSuggestion}</p>
                <p className="text-xs mt-1"><em>Alignement : {state.musicPlaceholder.moodAlignment}</em></p>
              </div>
            </div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-sky-200 mt-8 mb-4 text-center">Script Maître & Storyboard Détaillé</h3>
        <div className="space-y-6">
        {state.scriptData?.segments.map(segment => (
            <div key={`segment-master-${segment.scene}`} className="p-4 border border-slate-600 rounded-lg bg-slate-800/60 shadow-lg">
                <h4 className="text-xl font-semibold text-sky-300 mb-3">Scène {segment.scene} <span className="text-base font-normal text-slate-400">({segment.duration_seconds}s)</span></h4>
                
                <div className="mb-3">
                    <strong className="text-sky-400">Description Visuelle :</strong>
                    <p className="ml-2 text-slate-300">{segment.visual_description}</p>
                </div>

                {visualsByScene_PlanResults[segment.scene] && visualsByScene_PlanResults[segment.scene].length > 0 && (
                    <div className="my-4">
                        <h5 className="text-md font-semibold text-sky-400 mb-2">Image(s) Clé(s) IA pour Scène {segment.scene} :</h5>
                        <GeneratedImageView images={visualsByScene_PlanResults[segment.scene]} />
                    </div>
                )}
                
                <div className="mb-3">
                    <strong className="text-sky-400">Dialogue / Voix Off :</strong>
                    <p className="ml-2 text-slate-200 italic">"{segment.dialogue_voiceover}"</p>
                </div>

                {state.voiceOverPlaceholder && (
                      <p className="text-xs text-slate-500 mt-2">
                        <span className="font-semibold">Rappel Voix :</span> {state.voiceOverPlaceholder.styleSuggestion}
                      </p>
                )}
                {state.musicPlaceholder && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold">Rappel Musique :</span> {state.musicPlaceholder.styleSuggestion}
                      </p>
                )}
            </div>
        ))}
        </div>
        
        {state.generatedSrt && (
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-sky-300 mb-2">Plan Sous-titres (Aperçu SRT)</h3>
                <pre className="whitespace-pre-wrap p-3 bg-slate-700 rounded text-xs max-h-48 overflow-y-auto shadow-inner">{state.generatedSrt}</pre>
            </div>
        )}
          <div className="mt-8 text-center">
            <button
                onClick={handleGenerateVeedioPrompt}
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
            >
                Exporter pour Veed.io (Générer Prompt)
            </button>
        </div>
        <p className="mt-8 text-sm text-slate-400 text-center">Ce blueprint de production est prêt. L'étape suivante implique l'utilisation d'outils de montage vidéo pour produire ces éléments et assembler la vidéo finale. Pour l'instant, obtenons des suggestions de publication !</p>
      </StepOutput>
    );
  };

  const renderPublishingSuggestionsResults = () => {
    if (!state.publishingSuggestions) return null;
    return (
      <StepOutput title="Suggestions de Publication" icon={<PublishIcon />}>
        <div className="space-y-3">
          <p><strong>Heure de Publication Optimale :</strong> {state.publishingSuggestions.optimal_posting_time}</p>
          <div>
            <h4 className="font-semibold text-md text-sky-300">Hashtags Suggérés :</h4>
            <ul className="list-disc list-inside">
              {state.publishingSuggestions.hashtags.map(tag => <li key={tag}>{tag}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-md text-sky-300">Idées de Légendes :</h4>
            <ul className="list-disc list-inside">
              {state.publishingSuggestions.caption_ideas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-md text-sky-300">Conseils d'Engagement :</h4>
            <ul className="list-disc list-inside">
              {state.publishingSuggestions.engagement_tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
          <p className="mt-6 text-center text-lg font-semibold text-green-400">ViralTok AI Nexus a terminé le plan de création de contenu et de publication !</p>
        </div>
      </StepOutput>
    );
  };


  const renderCurrentStage = () => {
    if (state.isLoading && state.stage !== AppStage.INITIAL_CONFIG && state.apiKeyStatus === 'success') { 
        let message = "L'Agent IA réfléchit...";
        if (state.stage === AppStage.TREND_ANALYSIS_PENDING) message = "Analyse des dernières tendances TikTok & sélection du meilleur sujet...";
        if (state.stage === AppStage.SCRIPT_GENERATION_PENDING) message = `Création du script pour "${state.selectedTopic || 'sujet sélectionné'}"...`;
        if (state.stage === AppStage.VISUAL_GENERATION_PENDING) message = "Génération d'images clés contextuelles pour le storyboard..."; 
        if (state.stage === AppStage.AUDIO_SUBTITLES_PENDING) message = "Planification de l'audio & des sous-titres...";
        if (state.stage === AppStage.VIDEO_PLANNING_PENDING) message = "Préparation du plan d'assemblage vidéo...";
        if (state.stage === AppStage.PUBLISHING_SUGGESTIONS_PENDING) message = "Optimisation de la stratégie de publication...";
      return <LoadingIndicator message={state.loadingMessageDetail || message} />; 
    }

    if (state.agentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL &&
        state.stage === AppStage.PUBLISHING_SUGGESTIONS_RESULTS &&
        !state.isLoading) {
      return (
        <>
          {state.scriptData && renderVideoPlanningResults()}
          {state.publishingSuggestions && renderPublishingSuggestionsResults()}
          <p className="mt-6 text-center text-lg font-semibold text-green-400" aria-live="assertive">
            Processus automatique terminé ! Vous pouvez consulter tous les résultats ci-dessus.
          </p>
        </>
      );
    }


    switch (state.stage) {
      case AppStage.ERROR:
        return (
          <div aria-live="assertive">
            <StepOutput title="Erreur" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}>
              <p className="text-red-400">{state.errorMessage || "Une erreur inattendue s'est produite."}</p>
              {(state.errorMessage === ENV_API_KEY_MISSING_ERROR || state.errorMessage?.includes(API_KEY_INVALID_ERROR.substring(0,20)) || state.errorMessage?.includes(API_CLIENT_INIT_ERROR.substring(0,10))) && (
                <p className="text-sm text-slate-400 mt-2">
                  Veuillez vous assurer que votre variable d'environnement <code>API_KEY</code> est correctement configurée avec une clé API Google Gemini valide.
                </p>
              )}
              <button onClick={handleReset} className="mt-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg">Réessayer / Recommencer</button>
            </StepOutput>
          </div>
        );

      case AppStage.TREND_ANALYSIS_RESULTS:
        const analysis = state.trendingTopicsAnalysis;
        return (
          <StepOutput title="Analyse des Sujets Tendance" icon={<TrendIcon />}>
            {analysis && analysis.suggested_topics.length > 0 ? (
              <>
                {analysis.ai_chosen_topic && (
                  <div className="mb-4 p-3 bg-sky-800/50 border border-sky-700 rounded-md">
                    <h4 className="text-md font-semibold text-sky-300">Choix Principal de l'IA :</h4>
                    <p className="font-bold text-sky-200">{analysis.ai_chosen_topic.topic}</p>
                    <p className="text-sm text-sky-400 mt-1"><em>Raisonnement : {analysis.ai_chosen_topic.reasoning}</em></p>
                  </div>
                )}
                <p className="mb-3">
                  {state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF 
                    ? "Sélectionnez un sujet parmi les suggestions de l'IA (le choix principal de l'IA est mis en évidence), ou affinez votre sujet sélectionné ci-dessous :"
                    : "L'IA a analysé ces sujets. Le choix principal est affiché ci-dessus."}
                </p>
                <ul className="space-y-2 mb-4">
                  {analysis.suggested_topics.map((topic, index) => (
                    <li key={index} 
                        role="button"
                        tabIndex={0}
                        aria-pressed={state.selectedTopic === topic}
                        className={`p-3 rounded-md transition-all outline-none focus:ring-2 focus:ring-sky-300
                          ${state.selectedTopic === topic ? 'bg-sky-600 ring-2 ring-sky-400' : 'bg-slate-700'} 
                          ${analysis.ai_chosen_topic?.topic === topic && state.selectedTopic !== topic && state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF ? 'border-2 border-sky-500 shadow-md' : ''}
                          ${state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF ? 'cursor-pointer hover:bg-slate-600' : 'cursor-default'}`}
                        onClick={() => {
                            if (state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF) {
                                setState(prev => ({ ...prev, selectedTopic: topic, userTopicRefinement: '' }));
                            }
                        }}
                        onKeyDown={(e) => {
                              if (state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                setState(prev => ({ ...prev, selectedTopic: topic, userTopicRefinement: '' }));
                            }
                        }}
                    >
                      {topic}
                      {state.agentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL && state.selectedTopic === topic && <span className="text-xs ml-2 text-sky-300">(Auto-sélectionné par l'IA)</span>}
                    </li>
                  ))}
                </ul>

                {state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF && state.selectedTopic && (
                  <div className="mt-4">
                    <label htmlFor="userTopicRefinement" className="block text-sm font-medium text-slate-300 mb-1">
                      Affiner "{state.selectedTopic}" (mots-clés optionnels) :
                    </label>
                    <input
                      type="text"
                      id="userTopicRefinement"
                      value={state.userTopicRefinement}
                      onChange={(e) => setState(prev => ({...prev, userTopicRefinement: e.target.value}))}
                      placeholder="ex: pour débutants, astuces rapides, angle humoristique"
                      className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md shadow-sm p-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                )}

                  {state.agentMode === AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL && state.selectedTopic && !state.isLoading && (
                    <p className="mt-3 text-sm text-sky-400">L'IA a auto-sélectionné : "{state.selectedTopic}". Passage automatique à l'étape suivante.</p>
                )}
              </>
            ) : (
              <p>{state.errorMessage || "Aucun sujet tendance trouvé par l'IA. Essayez de fournir un sujet personnalisé ou de relancer l'analyse des tendances."}</p>
            )}
          </StepOutput>
        );
      
      case AppStage.SCRIPT_GENERATION_RESULTS:
        if (!state.scriptData) return <p>Aucun script généré.</p>;
        return (
          <StepOutput title={`Script pour : ${state.scriptData.title}`} icon={<ScriptIcon />}>
            <div className="space-y-3">
              <p><strong>Public Cible :</strong> {state.scriptData.target_audience}</p>
              <p><strong>Ambiance Générale :</strong> {state.scriptData.overall_mood}</p>
              <p><strong>Mots-clés :</strong> {state.scriptData.keywords.join(', ')}</p>
              <p><strong>Suggestion d'Accroche :</strong> {state.scriptData.hook_suggestion}</p>
              <p><strong>Suggestion de CTA :</strong> {state.scriptData.cta_suggestion}</p>
              <h4 className="font-semibold mt-4 mb-2 text-lg text-sky-300">Texte Complet pour Voix Off :</h4>
              <pre className="whitespace-pre-wrap p-3 bg-slate-700 rounded text-sm">{state.scriptData.full_text_for_voiceover}</pre>
              <h4 className="font-semibold mt-4 mb-2 text-lg text-sky-300">Segments du Script :</h4>
              {state.scriptData.segments.map(seg => (
                <div key={seg.scene} className="p-3 border border-slate-600 rounded-md bg-slate-700/50">
                  <p><strong>Scène {seg.scene} ({seg.duration_seconds}s) :</strong></p>
                  <p><em>Visuel :</em> {seg.visual_description}</p>
                  <p><em>Voix Off :</em> {seg.dialogue_voiceover}</p>
                </div>
              ))}
              {state.agentMode === AgentInteractionMode.CO_PILOTE_CREATIF && (
                <div className="mt-4">
                    <label htmlFor="userScriptFeedback" className="block text-sm font-medium text-slate-300 mb-1">Affiner le script (feedback optionnel pour régénération) :</label>
                    <textarea 
                        id="userScriptFeedback"
                        rows={2}
                        className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md shadow-sm p-2 focus:ring-sky-500 focus:border-sky-500"
                        value={state.userScriptFeedback}
                        onChange={(e) => setState(prev => ({...prev, userScriptFeedback: e.target.value}))}
                        placeholder="ex: Rendre plus drôle, cibler un public plus jeune..."
                    />
                    {state.userScriptFeedback && 
                      <button onClick={() => executeScriptGenerationInternal(state.selectedTopic || undefined)} className="mt-2 bg-sky-700 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Régénérer le Script avec Feedback</button>
                    }
                </div>
              )}
            </div>
          </StepOutput>
        );

      case AppStage.VISUAL_GENERATION_RESULTS:
        return (
          <StepOutput title="Images Clés du Storyboard" icon={<ImageIcon />}>
            {Object.keys(visualsByScene_VisResults).length > 0 ? (
              Object.entries(visualsByScene_VisResults).map(([sceneNum, images]) => (
                <div key={`scene-vis-${sceneNum}`} className="mb-6">
                  <h4 className="text-lg font-semibold text-sky-300 mb-2">Images Clés pour Scène {sceneNum} (Ambiance: {state.scriptData?.overall_mood}, Public: {state.scriptData?.target_audience}):</h4>
                  <GeneratedImageView images={images} />
                </div>
              ))
            ) : (
              <p>Aucune image clé générée pour les segments du script. L'opération a pu être annulée ou a échoué.</p>
            )}
            <p className="mt-4 text-sm text-slate-400">Note : Ce sont des images clés générées par IA, informées par l'ambiance du script et le public cible. Les clips vidéo réels nécessiteraient une génération ou une recherche supplémentaire.</p>
          </StepOutput>
        );

      case AppStage.AUDIO_SUBTITLES_RESULTS:
        return (
            <StepOutput title="Plan Audio & Sous-titres" icon={<AudioIcon />}>
                <div className="space-y-4">
                    {state.voiceOverPlaceholder && (
                        <div>
                            <h4 className="font-semibold text-md text-sky-300">Plan Voix Off :</h4>
                            <p><strong>Style Suggéré :</strong> {state.voiceOverPlaceholder.styleSuggestion}</p>
                            <p className="text-sm"><em>{state.voiceOverPlaceholder.sampleCue}</em></p>
                        </div>
                    )}
                    {state.musicPlaceholder && (
                        <div>
                            <h4 className="font-semibold text-md text-sky-300">Plan Musical :</h4>
                            <p><strong>Style Suggéré :</strong> {state.musicPlaceholder.styleSuggestion}</p>
                            <p className="text-sm"><em>{state.musicPlaceholder.moodAlignment}</em></p>
                        </div>
                    )}
                    {state.generatedSrt && (
                          <div>
                            <h4 className="font-semibold text-md text-sky-300">Plan Sous-titres (format type SRT) :</h4>
                            <pre className="whitespace-pre-wrap p-2 bg-slate-700 rounded text-xs max-h-48 overflow-y-auto">{state.generatedSrt}</pre>
                        </div>
                    )}
                </div>
                <p className="mt-4 text-sm text-slate-400">Note : Ce sont des plans générés par IA. La génération audio réelle, la musique et les sous-titres nécessitent des outils/API dédiés.</p>
            </StepOutput>
        );
      
      case AppStage.VIDEO_PLANNING_RESULTS:
          return renderVideoPlanningResults();

      case AppStage.PUBLISHING_SUGGESTIONS_RESULTS:
          return renderPublishingSuggestionsResults();
      default:
        if (state.stage === AppStage.INITIAL_CONFIG && state.apiKeyStatus === 'success') {
              return <div className="text-center p-6 text-slate-400" aria-live="polite">Configurez votre Agent IA ci-dessus et cliquez sur "Démarrer".</div>;
        }
        return null; 
    }
  };

  const appTitleFr = "ViralTok AI Nexus"; 
  const appSubtitleFr = "Votre Co-Pilote IA pour Contenu TikTok Viral";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 py-8 px-4 flex flex-col items-center" aria-live="polite">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
          {appTitleFr}
        </h1>
        <p className="text-slate-400 mt-2 text-lg">{appSubtitleFr}</p>
      </header>

      <main className="w-full">
        <ControlsPanel
          agentMode={state.agentMode}
          setAgentMode={(mode) => setState(prev => ({ ...prev, agentMode: mode }))}
          agentStyle={state.agentStyle}
          setAgentStyle={(style) => setState(prev => ({ ...prev, agentStyle: style }))}
          audacityLevel={state.audacityLevel}
          setAudacityLevel={(level) => setState(prev => ({ ...prev, audacityLevel: level }))}
          customTopic={state.customTopic}
          setCustomTopic={(topic) => setState(prev => ({ ...prev, customTopic: topic }))}
          currentStage={state.stage}
          onNextStep={handleNextStep}
          onReset={handleReset}
          apiKeyOk={state.apiKeyStatus === 'success'}
          apiKeyMessage={state.apiKeyStatus === 'error' ? state.errorMessage : undefined}
        />
        
        {state.apiKeyStatus === 'success' && renderCurrentStage()}
        {state.apiKeyStatus === 'pending' && <LoadingIndicator message="Vérification de la clé API..." />}

        {state.showVeedioPromptModal && state.veedioPrompt && (
          <Modal 
            title="Prompt pour Veed.io (Généré par ViralTokAINexus)" 
            isOpen={state.showVeedioPromptModal} 
            onClose={handleCloseVeedioModal}
          >
            <textarea
              readOnly
              className="w-full h-64 bg-slate-900 text-slate-200 p-3 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono whitespace-pre-wrap"
              value={state.veedioPrompt}
            />
            <button
              onClick={handleCopyVeedioPrompt}
              className={`mt-4 w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out
                ${promptCopied ? 'bg-green-600 hover:bg-green-500' : 'bg-sky-600 hover:bg-sky-500'}`}
            >
              {promptCopied ? <CheckIcon /> : <CopyIcon />}
              {promptCopied ? 'Prompt Copié !' : 'Copier le Prompt'}
            </button>
          </Modal>
        )}

      </main>
      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} ViralTokAINexus. Propulsé par l'API Gemini.</p>
          <p className="text-xs mt-1">
            {state.apiKeyStatus !== 'success' 
              ? "Veuillez configurer votre variable d'environnement API_KEY pour Google Gemini."
              : "N'oubliez pas de gérer votre clé API de manière sécurisée et de ne pas l'exposer publiquement."
            }
          </p>
      </footer>
    </div>
  );
};

export default App;