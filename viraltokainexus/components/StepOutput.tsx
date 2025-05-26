
import React from 'react';

interface StepOutputProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode; // e.g., SVG icon
}

const StepOutput: React.FC<StepOutputProps> = ({ title, children, icon }) => {
  return (
    <div className="bg-slate-800 shadow-2xl rounded-xl p-6 my-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center mb-4">
        {icon && <span className="mr-3 text-sky-400">{icon}</span>}
        <h2 className="text-2xl font-semibold text-sky-400">{title}</h2>
      </div>
      <div className="text-slate-300 prose prose-invert max-w-none prose-sm md:prose-base">
        {children}
      </div>
    </div>
  );
};

export default StepOutput;
