import React, { useState } from 'react';

interface ProductThumbProps {
  imageType: string;
  brand: string;
  imageUrl?: string;
  className?: string;
}

export const ProductThumb: React.FC<ProductThumbProps> = ({
  imageType,
  brand,
  imageUrl,
  className = 'w-24 h-24',
}) => {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      <div className={`${className} flex items-center justify-center p-1 relative select-none overflow-hidden rounded bg-white`}>
        <img
          src={imageUrl}
          alt={brand}
          onError={() => setImgError(true)}
          className="max-h-full max-w-full object-contain rounded transition-transform duration-200 hover:scale-105 drop-shadow-xs"
        />
      </div>
    );
  }

  switch (imageType) {
    case 'alternateur':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Outer casing */}
            <circle cx="50" cy="50" r="38" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="32" fill="#64748b" />
            {/* Vents */}
            <path d="M50 22 L50 30 M50 70 L50 78 M22 50 L30 50 M70 50 L78 50" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 30 L36 36 M64 64 L70 70 M30 70 L36 64 M64 36 L70 30" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            {/* Center Pulley */}
            <circle cx="50" cy="50" r="16" fill="#334155" stroke="#0f172a" strokeWidth="2" />
            <circle cx="50" cy="50" r="9" fill="#0f172a" />
            <circle cx="50" cy="50" r="4" fill="#cbd5e1" />
            {/* Mounting ears */}
            <rect x="10" y="24" width="10" height="12" rx="3" fill="#334155" />
            <circle cx="15" cy="30" r="3" fill="#cbd5e1" />
            <rect x="80" y="64" width="10" height="12" rx="3" fill="#334155" />
            <circle cx="85" cy="70" r="3" fill="#cbd5e1" />
            {/* Copper coils glow */}
            <circle cx="50" cy="50" r="24" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        </div>
      );

    case 'demarreur':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Main starter motor body */}
            <rect x="18" y="42" width="55" height="32" rx="6" fill="#334155" stroke="#1e293b" strokeWidth="2" />
            {/* Solenoid on top */}
            <rect x="25" y="20" width="38" height="20" rx="4" fill="#475569" stroke="#1e293b" strokeWidth="2" />
            {/* Drive pinion gear on right */}
            <rect x="73" y="48" width="16" height="20" rx="2" fill="#94a3b8" />
            <path d="M78 48 L78 68 M83 48 L83 68 M88 48 L88 68" stroke="#334155" strokeWidth="1.5" />
            {/* Terminal bolt */}
            <circle cx="68" cy="30" r="3.5" fill="#f59e0b" />
            {/* Flange plate */}
            <path d="M68 36 L74 36 L74 78 L68 78 Z" fill="#64748b" />
          </svg>
        </div>
      );

    case 'balais':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Curved wiper blade 1 */}
            <path d="M12 68 Q 50 32 88 42" fill="none" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M12 68 Q 50 32 88 42" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            {/* Curved wiper blade 2 */}
            <path d="M20 78 Q 55 46 84 56" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
            {/* Center connector clip */}
            <rect x="46" y="38" width="8" height="8" rx="2" fill="#dc2626" />
          </svg>
        </div>
      );

    case 'disque':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Ventilated Brake Disc */}
            <circle cx="50" cy="50" r="42" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
            <circle cx="50" cy="50" r="32" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            {/* Ventilation grooves */}
            <circle cx="50" cy="50" r="37" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Hat center hub */}
            <circle cx="50" cy="50" r="22" fill="#64748b" stroke="#334155" strokeWidth="2" />
            <circle cx="50" cy="50" r="10" fill="#334155" />
            {/* 4 Lug Bolt Holes */}
            <circle cx="50" cy="35" r="3" fill="#0f172a" />
            <circle cx="50" cy="65" r="3" fill="#0f172a" />
            <circle cx="35" cy="50" r="3" fill="#0f172a" />
            <circle cx="65" cy="50" r="3" fill="#0f172a" />
          </svg>
        </div>
      );

    case 'filtre_air':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Box frame with Bosch packaging aesthetic */}
            <rect x="15" y="24" width="70" height="52" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
            {/* Orange rubber seal */}
            <rect x="12" y="21" width="76" height="58" rx="5" fill="none" stroke="#ea580c" strokeWidth="3" />
            {/* Filter paper pleats */}
            <path
              d="M22 26 L22 74 M28 26 L28 74 M34 26 L34 74 M40 26 L40 74 M46 26 L46 74 M52 26 L52 74 M58 26 L58 74 M64 26 L64 74 M70 26 L70 74 M76 26 L76 74"
              stroke="#eab308"
              strokeWidth="2.5"
            />
            {/* Blue Brand corner label */}
            <rect x="16" y="25" width="22" height="12" rx="2" fill="#0284c7" />
            <text x="27" y="33" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">
              BOSCH
            </text>
          </svg>
        </div>
      );

    case 'filtre_gasoil':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Metal fuel canister */}
            <rect x="28" y="26" width="44" height="54" rx="8" fill="#334155" stroke="#0f172a" strokeWidth="2" />
            {/* Metallic shine */}
            <rect x="36" y="26" width="8" height="54" fill="#475569" opacity="0.6" />
            {/* Fuel In/Out spouts on top */}
            <rect x="36" y="16" width="6" height="11" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <rect x="56" y="16" width="6" height="11" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            {/* Drain plug bottom */}
            <rect x="46" y="80" width="8" height="6" rx="1" fill="#f59e0b" />
            {/* Brand band */}
            <rect x="28" y="44" width="44" height="14" fill="#0284c7" />
            <text x="50" y="53" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
              BOSCH
            </text>
          </svg>
        </div>
      );

    case 'filtre_huile':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Oil filter cylindrical element */}
            <rect x="30" y="22" width="40" height="56" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
            {/* Black top and bottom caps */}
            <rect x="26" y="18" width="48" height="9" rx="3" fill="#1e293b" />
            <rect x="26" y="73" width="48" height="9" rx="3" fill="#1e293b" />
            {/* Paper pleats */}
            <path
              d="M36 26 L36 73 M42 26 L42 73 M48 26 L48 73 M54 26 L54 73 M60 26 L60 73 M64 26 L64 73"
              stroke="#d97706"
              strokeWidth="2"
            />
            {/* Center core */}
            <circle cx="50" cy="22" r="5" fill="#0f172a" />
            {/* Rubber O-ring */}
            <circle cx="76" cy="65" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
          </svg>
        </div>
      );

    case 'batterie':
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Battery Casing */}
            <rect x="18" y="32" width="64" height="48" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            {/* Top terminal lid */}
            <rect x="22" y="26" width="56" height="8" rx="2" fill="#334155" />
            {/* Positive (+) Terminal Red */}
            <rect x="28" y="18" width="10" height="9" rx="1" fill="#dc2626" />
            <text x="33" y="25" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
              +
            </text>
            {/* Negative (-) Terminal Black */}
            <rect x="62" y="18" width="10" height="9" rx="1" fill="#475569" />
            <text x="67" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
              -
            </text>
            {/* Brand label */}
            <rect x="24" y="44" width="52" height="24" fill="#dc2626" rx="2" />
            <text x="50" y="55" fill="#ffffff" fontSize="7" fontWeight="black" textAnchor="middle">
              ENERGIZER
            </text>
            <text x="50" y="64" fill="#fef08a" fontSize="6" fontWeight="bold" textAnchor="middle">
              PLUS 60Ah
            </text>
          </svg>
        </div>
      );

    case 'liquide':
    default:
      return (
        <div className={`${className} flex items-center justify-center p-2 relative select-none`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* 5L Motor Oil Jug */}
            <path
              d="M32 30 L45 30 L45 22 L55 22 L55 30 L68 30 L74 44 L74 82 L26 82 L26 44 Z"
              fill="#2563eb"
              stroke="#1d4ed8"
              strokeWidth="2"
            />
            {/* Ergonomic handle */}
            <path d="M42 38 Q 28 42 30 64 Q 38 68 44 68 Z" fill="#f8fafc" />
            {/* Cap */}
            <rect x="47" y="16" width="12" height="7" rx="2" fill="#dc2626" />
            {/* Level strip */}
            <rect x="68" y="46" width="3" height="32" fill="#ffffff" opacity="0.6" />
            {/* Label */}
            <rect x="42" y="46" width="28" height="30" rx="2" fill="#f8fafc" />
            <rect x="44" y="49" width="24" height="6" fill="#dc2626" />
            <text x="56" y="54" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">
              {brand}
            </text>
            <text x="56" y="64" fill="#1e293b" fontSize="6.5" fontWeight="black" textAnchor="middle">
              5W-30
            </text>
            <text x="56" y="71" fill="#475569" fontSize="4" textAnchor="middle">
              5 LITRES
            </text>
          </svg>
        </div>
      );
  }
};
