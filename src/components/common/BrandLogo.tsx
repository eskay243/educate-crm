import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  logoUrl?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-primary',
  subtextColor = 'text-secondary',
  logoUrl = '/logo.png',
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);

  const dimensionMap = {
    sm: { box: 'w-8 h-8', icon: 18, text: 'text-sm', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10', icon: 22, text: 'text-base', sub: 'text-xs' },
    lg: { box: 'w-12 h-12', icon: 26, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', icon: 36, text: 'text-xl', sub: 'text-sm' },
  };

  const currentDim = dimensionMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem / Logo Icon */}
      <div 
        className={`${currentDim.box} rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shrink-0 shadow-sm border border-primary/20 overflow-hidden relative group`}
        title="CODELAB EDUCARE LTD"
      >
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt="CODELAB EDUCARE LTD"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/5 h-3/5 text-white"
          >
            {/* Geometric Educare Monogram / Code Cap */}
            <path
              d="M16 4L3 11L16 18L29 11L16 4Z"
              fill="currentColor"
              fillOpacity="0.95"
            />
            <path
              d="M7 14.5V21.5C7 24.5 11 27 16 27C21 27 25 24.5 25 21.5V14.5L16 19.5L7 14.5Z"
              fill="currentColor"
              fillOpacity="0.75"
            />
            <path
              d="M27 12V21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="27" cy="22" r="1.5" fill="currentColor" />
          </svg>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className={`font-bold font-headline-md leading-tight tracking-tight ${textColor} ${currentDim.text} truncate`}>
              CODELAB EDUCARE
            </h1>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 tracking-wider">
              LTD
            </span>
          </div>
          <p className={`font-body-sm truncate leading-tight ${subtextColor} ${currentDim.sub}`}>
            Enterprise Operations Suite
          </p>
        </div>
      )}
    </div>
  );
};
