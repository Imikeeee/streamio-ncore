import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ErrorTooltipProps {
  message: string;
  className?: string;
}

const ErrorTooltip = ({ message, className = "" }: ErrorTooltipProps) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className={`relative inline-flex items-center group ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <AlertCircle className="w-5 h-5 text-red-500 cursor-help transition-transform hover:scale-110" />
      
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-red-950 border border-red-500/50 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
          <p className="text-xs text-red-200 leading-relaxed font-medium">
            {message || 'An unknown error occurred'}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-8 border-transparent border-t-red-500/50" />
        </div>
      )}
    </div>
  );
};

export default ErrorTooltip;
