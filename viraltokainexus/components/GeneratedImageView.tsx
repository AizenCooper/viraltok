import React from 'react';
import { GeneratedImage } from '../types';

interface GeneratedImageViewProps {
  images: GeneratedImage[];
}

const GeneratedImageView: React.FC<GeneratedImageViewProps> = ({ images }) => {
  if (!images || images.length === 0) {
    return <p>Aucune image générée pour l'instant, ou la génération a échoué pour toutes.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image.id} className="bg-slate-700 p-3 rounded-lg shadow-lg">
          <img
            src={`data:image/jpeg;base64,${image.base64Data}`}
            alt={image.prompt.substring(0,50) || 'Visuel généré'}
            className="w-full h-auto object-contain rounded aspect-[9/16]"
          />
          <p className="text-xs text-slate-400 mt-2 truncate" title={image.prompt}>
            Prompt : {image.prompt.substring(0, 70)}{image.prompt.length > 70 && '...'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default GeneratedImageView;