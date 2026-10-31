'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { WHATSAPP_CONTACT } from '@/config/theme';

export function WhatsAppContactButton() {
  const t = useTranslations('WhatsApp');
  const locale = useLocale();
  const pathname = usePathname();
  const isAr = locale === 'ar';

  const containerRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Close when tapping / clicking outside the floating button
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Do not render floating storefront contact button on standalone admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const whatsappUrl = WHATSAPP_CONTACT.getUrl(locale);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if the current interaction is on a mobile viewport, touch device, or touch pointer
    const isTouchOrMobile =
      typeof window !== 'undefined' &&
      (!window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
        window.innerWidth < 640 ||
        (e.nativeEvent as PointerEvent)?.pointerType === 'touch');

    // On touch / mobile devices:
    // First tap opens the shirt to reveal the WhatsApp mark without navigating away
    if (isTouchOrMobile && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    // Second tap (or click on desktop) proceeds to open WhatsApp
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <aside
      ref={containerRef}
      aria-label={t('ariaLabel')}
      className="fixed z-40 flex flex-col items-center pointer-events-none select-none end-3.5 min-[360px]:end-4 sm:end-6"
      style={{
        bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          isOpen
            ? (isAr ? 'فتح محادثة واتساب' : 'Open WhatsApp chat')
            : t('ariaLabel')
        }
        title={t('ariaLabel')}
        aria-expanded={isOpen}
        data-open={isOpen ? 'true' : 'false'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="group pointer-events-auto flex flex-col items-center gap-1.5 rounded-2xl p-1 transition-transform duration-300 hover:scale-[1.04] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9783D]"
      >
        {/* ===================================================================
            TAILORED SHIRT BUTTON SILHOUETTE (#D9783D)
            - At rest: closed tailored shirt in #D9783D (collar, placket, pearl buttons, breast pocket)
            - Desktop hover / keyboard focus: panels smoothly part open to reveal WhatsApp logo
            - Touch screens & mobile: shirt stays closed on load; first tap opens it, second tap navigates
            - Tapping outside closes the shirt
           =================================================================== */}
        <div className="relative flex h-[50px] w-[50px] min-[360px]:h-14 min-[360px]:w-14 sm:h-16 sm:w-16 items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
          <svg
            viewBox="0 0 68 68"
            className="h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              {/* Subtle fabric gradient for tailored depth with primary #D9783D */}
              <linearGradient id="labsaShirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E28247" />
                <stop offset="100%" stopColor="#D9783D" />
              </linearGradient>

              {/* Inner neck shadow */}
              <linearGradient id="labsaNeckShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8C441B" />
                <stop offset="100%" stopColor="#A85424" />
              </linearGradient>
            </defs>

            {/* Back Neck / Collar Stand (Base Layer) */}
            <path
              d="M24 13 C28 9, 40 9, 44 13 L42 18 C38 15, 30 15, 26 18 Z"
              fill="url(#labsaNeckShadow)"
              stroke="#F7E7DE"
              strokeWidth="0.75"
              strokeOpacity="0.5"
            />

            {/* ===============================================================
                LAYER 1: REVEALED WHATSAPP CORE
                - Centered inside the shirt chest
                - Genuine official WhatsApp brand icon
               =============================================================== */}
            <g className="labsa-wa-core origin-[34px_38px] transition-all duration-300 ease-out">
              {/* WhatsApp Green Circle */}
              <circle
                cx="34"
                cy="38"
                r="13.5"
                fill="#25D366"
                className="filter drop-shadow-[0_2px_4px_rgba(37,211,102,0.35)]"
              />

              {/* Genuine Official WhatsApp Vector Icon (Speech Bubble + Handset) */}
              <g transform="translate(22.5, 26.5) scale(0.96)">
                <path
                  fill="#FFFFFF"
                  d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.04 20.16C10.55 20.16 9.09 19.76 7.82 19L7.52 18.82L4.41 19.64L5.24 16.61L5.04 16.29C4.21 14.97 3.77 13.46 3.77 11.91C3.77 7.36 7.48 3.64 12.04 3.64C14.25 3.64 16.32 4.51 17.88 6.07C19.44 7.63 20.31 9.7 20.31 11.91C20.31 16.47 16.59 20.16 12.04 20.16ZM16.57 14.39C16.32 14.26 15.09 13.66 14.86 13.58C14.64 13.49 14.47 13.45 14.31 13.7C14.14 13.95 13.66 14.52 13.51 14.69C13.37 14.86 13.22 14.88 12.97 14.76C12.72 14.63 11.92 14.37 10.97 13.52C10.23 12.86 9.73 12.05 9.58 11.8C9.44 11.55 9.57 11.41 9.69 11.29C9.8 11.18 9.94 11 10.06 10.86C10.19 10.72 10.23 10.61 10.31 10.45C10.39 10.28 10.35 10.14 10.29 10.01C10.23 9.89 9.73 8.66 9.52 8.16C9.32 7.67 9.12 7.74 8.97 7.73C8.83 7.72 8.66 7.72 8.5 7.72C8.33 7.72 8.06 7.78 7.84 8.03C7.61 8.27 6.97 8.87 6.97 10.09C6.97 11.31 7.86 12.49 7.98 12.65C8.11 12.82 9.73 15.31 12.21 16.38C12.8 16.64 13.26 16.79 13.62 16.91C14.21 17.1 14.76 17.07 15.19 17.01C15.66 16.94 16.64 16.41 16.84 15.84C17.05 15.27 17.05 14.78 16.99 14.68C16.93 14.57 16.82 14.51 16.57 14.39Z"
                />
              </g>
            </g>

            {/* ===============================================================
                LAYER 2: LEFT SHIRT PANEL
                - Left shoulder, left sleeve, chest with breast pocket, left collar flap
                - Glides left on hover / keyboard focus / tap open
               =============================================================== */}
            <g className="shirt-panel-left origin-[12px_22px]">
              {/* Left Body & Sleeve */}
              <path
                d="M24 13 L12 21 L6 33 L14 36 L16 54 Q25 57 34 56 L34 22 Z"
                fill="url(#labsaShirtGrad)"
                stroke="#F7E7DE"
                strokeWidth="0.85"
                strokeOpacity="0.5"
              />

              {/* Left Sleeve Hem Stitch */}
              <line
                x1="7"
                y1="31"
                x2="13.5"
                y2="34"
                stroke="#F7E7DE"
                strokeWidth="0.6"
                strokeDasharray="1.5 1"
                strokeOpacity="0.55"
              />

              {/* Left Breast Pocket with Topstitch */}
              <path
                d="M19 32 L27 32 L27 39 Q23 42 19 39 Z"
                fill="#C4672E"
                stroke="#F7E7DE"
                strokeWidth="0.65"
                strokeOpacity="0.5"
              />

              {/* Left Folded Collar Leaf */}
              <polygon
                points="24,13 32,25 34,21 28,13"
                fill="#E28247"
                stroke="#F7E7DE"
                strokeWidth="0.85"
                strokeOpacity="0.6"
              />
            </g>

            {/* ===============================================================
                LAYER 3: RIGHT SHIRT PANEL & BUTTON PLACKET
                - Right shoulder, sleeve, front placket strip, 3 pearl buttons, right collar
                - Glides right on hover / keyboard focus / tap open
               =============================================================== */}
            <g className="shirt-panel-right origin-[56px_22px]">
              {/* Right Body & Sleeve */}
              <path
                d="M44 13 L56 21 L62 33 L54 36 L52 54 Q43 57 34 56 L34 22 Z"
                fill="url(#labsaShirtGrad)"
                stroke="#F7E7DE"
                strokeWidth="0.85"
                strokeOpacity="0.5"
              />

              {/* Right Sleeve Hem Stitch */}
              <line
                x1="61"
                y1="31"
                x2="54.5"
                y2="34"
                stroke="#F7E7DE"
                strokeWidth="0.6"
                strokeDasharray="1.5 1"
                strokeOpacity="0.55"
              />

              {/* Front Central Button Placket Strip (overlaps center snug when closed) */}
              <rect
                x="31"
                y="21"
                width="6"
                height="35"
                rx="1"
                fill="#C4672E"
                stroke="#F7E7DE"
                strokeWidth="0.6"
                strokeOpacity="0.45"
              />

              {/* Tailored Pearl Buttons along Placket */}
              {/* Button 1 */}
              <circle cx="34" cy="28" r="1.8" fill="#FAF7F2" stroke="#8C441B" strokeWidth="0.5" />
              <circle cx="33.3" cy="28" r="0.25" fill="#8C441B" />
              <circle cx="34.7" cy="28" r="0.25" fill="#8C441B" />

              {/* Button 2 */}
              <circle cx="34" cy="38" r="1.8" fill="#FAF7F2" stroke="#8C441B" strokeWidth="0.5" />
              <circle cx="33.3" cy="38" r="0.25" fill="#8C441B" />
              <circle cx="34.7" cy="38" r="0.25" fill="#8C441B" />

              {/* Button 3 */}
              <circle cx="34" cy="48" r="1.8" fill="#FAF7F2" stroke="#8C441B" strokeWidth="0.5" />
              <circle cx="33.3" cy="48" r="0.25" fill="#8C441B" />
              <circle cx="34.7" cy="48" r="0.25" fill="#8C441B" />

              {/* Right Folded Collar Leaf */}
              <polygon
                points="44,13 36,25 34,21 40,13"
                fill="#E28247"
                stroke="#F7E7DE"
                strokeWidth="0.85"
                strokeOpacity="0.6"
              />
            </g>
          </svg>
        </div>

        {/* Directly beneath the shirt button: Localized action instruction pill */}
        <span className="rounded-full bg-[#D9783D] px-2 min-[360px]:px-2.5 py-0.5 text-[10px] min-[360px]:text-[11px] font-bold text-white shadow-md border border-white/20 tracking-tight whitespace-nowrap max-w-[110px] text-center truncate transition-colors duration-200 group-hover:bg-[#C4672E] group-hover:text-white group-focus-visible:bg-[#C4672E]">
          {isOpen
            ? (isAr ? 'فتح واتساب' : 'Open WhatsApp')
            : t('buttonInstruction')}
        </span>
      </a>

      {/* Embedded sartorial opening animation styles */}
      <style jsx global>{`
        /* Smooth Sartorial Opening Animation (250–350ms) */
        .shirt-panel-left {
          transform-box: fill-box;
          transform-origin: top left;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .shirt-panel-right {
          transform-box: fill-box;
          transform-origin: top right;
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .labsa-wa-core {
          transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Desktop Hover: strictly scoped to desktop with a real fine hover pointer */
        @media (min-width: 640px) and (hover: hover) and (pointer: fine) {
          .group:hover .shirt-panel-left {
            transform: translateX(-12px) rotate(-5deg);
          }
          .group:hover .shirt-panel-right {
            transform: translateX(12px) rotate(5deg);
          }
          .group:hover .labsa-wa-core {
            transform: scale(1.05);
          }
        }

        /* Keyboard Focus-Visible: accessible opening on any device */
        .group:focus-visible .shirt-panel-left {
          transform: translateX(-12px) rotate(-5deg);
        }
        .group:focus-visible .shirt-panel-right {
          transform: translateX(12px) rotate(5deg);
        }
        .group:focus-visible .labsa-wa-core {
          transform: scale(1.05);
        }

        /* Explicit Open State: used on touch devices after deliberate first tap */
        .group[data-open="true"] .shirt-panel-left,
        .group[aria-expanded="true"] .shirt-panel-left {
          transform: translateX(-10px) rotate(-4deg);
        }
        .group[data-open="true"] .shirt-panel-right,
        .group[aria-expanded="true"] .shirt-panel-right {
          transform: translateX(10px) rotate(4deg);
        }
        .group[data-open="true"] .labsa-wa-core,
        .group[aria-expanded="true"] .labsa-wa-core {
          transform: scale(1.05);
        }

        /* Honor user preference for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .shirt-panel-left,
          .shirt-panel-right,
          .labsa-wa-core {
            transition: none !important;
          }
        }
      `}</style>
    </aside>
  );
}

