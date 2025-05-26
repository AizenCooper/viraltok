
import React from 'react';
import { AgentInteractionMode, AgentStrategicStyle, AppStage } from '../types';

interface ControlsPanelProps {
  agentMode: AgentInteractionMode;
  setAgentMode: (mode: AgentInteractionMode) => void;
  agentStyle: AgentStrategicStyle;
  setAgentStyle: (style: AgentStrategicStyle) => void;
  audacityLevel: number;
  setAudacityLevel: (level: number) => void;
  customTopic: string;
  setCustomTopic: (topic: string) => void;
  currentStage: AppStage;
  onNextStep: () => void;
  onReset: () => void;
  apiKeyOk: boolean;
  apiKeyMessage?: string; // Message optionnel pour la clé API
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  agentMode,
  setAgentMode,
  agentStyle,
  setAgentStyle,
  audacityLevel,
  setAudacityLevel,
  customTopic,
  setCustomTopic,
  currentStage,
  onNextStep,
  onReset,
  apiKeyOk,
  apiKeyMessage
}) => {

  const getButtonText = () => {
    switch (currentStage) {
      case AppStage.INITIAL_CONFIG:
        return customTopic ? "Démarrer : Générer Script (Sujet Perso)" : "Démarrer : Analyser Tendances";
      case AppStage.TREND_ANALYSIS_RESULTS:
        return "Suivant : Générer Script";
      case AppStage.SCRIPT_GENERATION_RESULTS:
        return "Suivant : Générer Visuels";
      case AppStage.VISUAL_GENERATION_RESULTS:
        return "Suivant : Planifier Audio & Sous-titres";
      case AppStage.AUDIO_SUBTITLES_RESULTS:
        return "Suivant : Voir Plan d'Assemblage Vidéo";
      case AppStage.VIDEO_PLANNING_RESULTS: 
        return "Suivant : Obtenir Suggestions de Publication";
      default:
        return "Continuer";
    }
  };
  
  const isProcessing = currentStage.endsWith("_PENDING");

  if (!apiKeyOk) {
    return (
      <div className="bg-slate-800 shadow-2xl rounded-xl p-6 my-6 w-full max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-semibold text-red-500 mb-4">Erreur de Configuration de la Clé API</h2>
        <p className="text-slate-300">
          {apiKeyMessage || "Échec de l'initialisation avec la clé API Google Gemini. Veuillez vous assurer qu'elle est correctement configurée."}
        </p>
         <p className="text-xs text-slate-500 mt-2">
            Cette application s'attend à ce que votre clé API Google Gemini soit configurée via la variable d'environnement <code>API_KEY</code> dans votre environnement d'exécution.
         </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 shadow-2xl rounded-xl p-6 my-6 w-full max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-center text-sky-400 mb-6">Commandes de l'Agent IA</h2>

      {currentStage === AppStage.INITIAL_CONFIG && (
        <>
          <div>
            <label htmlFor="agentMode" className="block text-sm font-medium text-slate-300 mb-1">Mode de l'Agent</label>
            <select
              id="agentMode"
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value as AgentInteractionMode)}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md shadow-sm p-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value={AgentInteractionMode.CO_PILOTE_CREATIF}>Co-Pilote (Guidé par l'utilisateur)</option>
              <option value={AgentInteractionMode.PILOTE_AUTOMATIQUE_INTEGRAL}>Automatique Intégral (IA Décide)</option>
            </select>
          </div>

          <div>
            <label htmlFor="agentStyle" className="block text-sm font-medium text-slate-300 mb-1">Style Stratégique</label>
            <select
              id="agentStyle"
              value={agentStyle}
              onChange={(e) => setAgentStyle(e.target.value as AgentStrategicStyle)}
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md shadow-sm p-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value={AgentStrategicStyle.ENGAGEMENT_EQUILIBRE}>Engagement Équilibré</option>
              <option value={AgentStrategicStyle.BUZZ_MAXIMAL_AUDACIEUX}>Buzz Maximal (Audacieux)</option>
            </select>
          </div>

          {agentStyle === AgentStrategicStyle.BUZZ_MAXIMAL_AUDACIEUX && (
            <div>
              <label htmlFor="audacityLevel" className="block text-sm font-medium text-slate-300 mb-1">
                Niveau d'Audace : <span className="font-bold text-sky-400">{audacityLevel}</span>
              </label>
              <input
                type="range"
                id="audacityLevel"
                min="1"
                max="10"
                value={audacityLevel}
                onChange={(e) => setAudacityLevel(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          )}
          
           <div>
            <label htmlFor="customTopic" className="block text-sm font-medium text-slate-300 mb-1">
              Ou fournissez votre propre sujet (optionnel, l'IA générera le script directement) :
            </label>
            <input
              type="text"
              id="customTopic"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="ex: 'Idée de challenge de danse virale'"
              className="w-full bg-slate-700 border-slate-600 text-slate-100 rounded-md shadow-sm p-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        {currentStage !== AppStage.INITIAL_CONFIG && (
            <button
            onClick={onReset}
            disabled={isProcessing}
            className="w-full sm:w-auto flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50"
            >
            Réinitialiser / Recommencer
            </button>
        )}
        { ![AppStage.PUBLISHING_SUGGESTIONS_RESULTS, AppStage.ERROR].includes(currentStage) && (
            <button
                onClick={onNextStep}
                disabled={isProcessing || !apiKeyOk} // Désactiver si la clé API n'est pas OK
                className="w-full sm:w-auto flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {isProcessing ? 'Traitement...' : getButtonText()}
            </button>
        )}
      </div>
    </div>
  );
};

export default ControlsPanel;