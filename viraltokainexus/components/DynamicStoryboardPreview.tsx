import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScriptData, GeneratedImage, ScriptSegment } from '../types';

interface DynamicStoryboardPreviewProps {
  scriptData: ScriptData | null;
  visuals: GeneratedImage[];
  isPlaying: boolean;
  currentSegmentIndex: number;
  currentImageSubIndex: number;
  onPlayPause: () => void;
  onReset: () => void;
  onTick: (nextSegmentIndex: number, nextImageSubIndex: number) => void;
}

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.323 11.207a6.5 6.5 0 00-9.428-8.463.75.75 0 01.904-1.192 5 5 0 112.45 8.417.75.75 0 11-1.135.934H15.5A.75.75 0 0016.25 10V2.47a.75.75 0 011.5 0V10a2.25 2.25 0 01-2.25 2.25h-7.513a.75.75 0 110-1.5h4.586z" clipRule="evenodd" /></svg>;


const DynamicStoryboardPreview: React.FC<DynamicStoryboardPreviewProps> = ({
  scriptData,
  visuals,
  isPlaying,
  currentSegmentIndex,
  currentImageSubIndex,
  onPlayPause,
  onReset,
  onTick,
}) => {
  const [progress, setProgress] = useState(0); // Progression dans la durée du segment actuel

  const visualsByScene = useMemo(() => {
    return visuals.reduce((acc, img) => {
      acc[img.segmentScene] = acc[img.segmentScene] || [];
      acc[img.segmentScene].push(img);
      return acc;
    }, {} as Record<number, GeneratedImage[]>);
  }, [visuals]);

  const currentSegment: ScriptSegment | null = scriptData?.segments[currentSegmentIndex] || null;
  const imagesForCurrentSegment: GeneratedImage[] = currentSegment ? (visualsByScene[currentSegment.scene] || []) : [];
  const currentImage: GeneratedImage | null = imagesForCurrentSegment[currentImageSubIndex] || null;

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    let progressInterval: NodeJS.Timeout | undefined;

    if (isPlaying && currentSegment) {
      const segmentDurationMs = currentSegment.duration_seconds * 1000;
      const imageDisplayDurationMs = imagesForCurrentSegment.length > 0 ? segmentDurationMs / imagesForCurrentSegment.length : segmentDurationMs;
      
      const startTime = Date.now();
      
      progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        setProgress(Math.min(100, (elapsedTime / segmentDurationMs) * 100));
      }, 100);


      timer = setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(0);
        let nextSegIdx = currentSegmentIndex;
        let nextImgSubIdx = currentImageSubIndex + 1;

        if (nextImgSubIdx >= imagesForCurrentSegment.length) {
          nextImgSubIdx = 0;
          nextSegIdx += 1;
        }

        if (nextSegIdx >= (scriptData?.segments.length || 0)) {
          onPlayPause(); // Arrêter la lecture à la fin
          onReset();     // Optionnellement, réinitialiser au début
        } else {
          onTick(nextSegIdx, nextImgSubIdx);
        }
      }, imageDisplayDurationMs);
    } else {
      clearInterval(progressInterval); // Nettoyer si en pause ou pas de segment
      // Ne pas réinitialiser progress à 0 ici si on veut que la barre reste où elle était en pause.
      // Si on veut que la barre se réinitialise en pause, alors setProgress(0);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isPlaying, currentSegmentIndex, currentImageSubIndex, scriptData, imagesForCurrentSegment, onPlayPause, onReset, onTick, currentSegment]); // Ajout de currentSegment aux dépendances

  if (!scriptData) {
    return <p className="text-slate-400 text-center">Données du script non disponibles pour l'aperçu.</p>;
  }
  
  // const totalDuration = scriptData.segments.reduce((sum, seg) => sum + seg.duration_seconds, 0);


  return (
    <div className="bg-slate-700 p-4 rounded-lg shadow-xl w-full max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-sky-300 mb-3 text-center">Séquence Vidéo Planifiée par l'IA (Aperçu)</h3>
      
      <div className="aspect-[9/16] bg-slate-800 rounded overflow-hidden relative flex items-center justify-center mb-3">
        {currentImage ? (
          <img
            src={`data:image/jpeg;base64,${currentImage.base64Data}`}
            alt={`Scène ${currentSegment?.scene} - Image Clé`}
            className="w-full h-full object-contain"
          />
        ) : (
          currentSegment ? (
             <div className="p-4 text-slate-400 text-center">
                <p>Visuel pour Scène {currentSegment.scene}</p>
                <p className="text-sm italic">(Aucune image clé spécifique générée pour ce segment, ou pas d'image pour ce sous-index)</p>
                <p className="text-xs mt-2">{currentSegment.visual_description}</p>
            </div>
          ) : (
            <div className="p-4 text-slate-400 text-center">Fin de la séquence ou non démarrée.</div>
          )
        )}
        {currentSegment && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-xs">
                <p className="font-bold truncate">Scène {currentSegment.scene}: {currentSegment.dialogue_voiceover}</p>
            </div>
        )}
      </div>

      <div className="mb-3">
        <div className="w-full bg-slate-600 rounded-full h-2.5">
          <div 
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-100 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {currentSegment && (
             <p className="text-xs text-slate-400 text-center mt-1">
                Segment {currentSegmentIndex + 1} / {scriptData.segments.length} ({currentSegment.duration_seconds}s)
                {imagesForCurrentSegment.length > 0 && ` - Image ${currentImageSubIndex + 1}/${imagesForCurrentSegment.length}`}
             </p>
        )}
      </div>


      <div className="flex justify-center items-center space-x-3">
        <button
          onClick={onPlayPause}
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 shadow-md"
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
        </button>
        <button
          onClick={onReset}
          className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 shadow-md"
          aria-label="Réinitialiser l'aperçu"
        >
          <ResetIcon/>
          <span>Réinit.</span>
        </button>
      </div>
       <p className="text-xs text-slate-500 mt-3 text-center">Ceci est un aperçu du storyboard synchronisé basé sur le plan de l'IA. Pas une vidéo finale rendue.</p>
    </div>
  );
};

export default DynamicStoryboardPreview;