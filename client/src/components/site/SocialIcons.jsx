import { Globe, MessageCircle, Send } from 'lucide-react';

// Lucide no longer ships brand logos; these are simple, lightweight marks for footer social links.
const base = { width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': true };

const YouTubeIcon = (props) => (
  <svg {...base} fill="currentColor" {...props}>
    <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z" />
  </svg>
);
const FacebookIcon = (props) => (
  <svg {...base} fill="currentColor" {...props}>
    <path d="M13.5 21.9v-7.6h2.6l.4-3h-3V9.4c0-.9.3-1.5 1.6-1.5h1.6V5.2a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.2H7.7v3h2.6v7.6h3.2Z" />
  </svg>
);
const InstagramIcon = (props) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const XIcon = (props) => (
  <svg {...base} fill="currentColor" {...props}>
    <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.3l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z" />
  </svg>
);
const LinkedInIcon = (props) => (
  <svg {...base} fill="currentColor" {...props}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4v-11Z" />
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg {...base} fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.275-.1-.475-.15-.675.15-.2.3-.775.98-.95 1.18-.175.2-.35.225-.651.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.675-2.084-.175-.3-.019-.462.132-.612.136-.135.301-.35.451-.525.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.628-.925-2.228-.244-.585-.492-.506-.676-.515l-.576-.01c-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.502 0 1.477 1.075 2.903 1.225 3.103.15.2 2.115 3.23 5.124 4.53 1.05.454 1.87.725 2.51.928.704.225 1.345.193 1.85.118.564-.084 1.78-.727 2.03-1.428.25-.7.25-1.301.175-1.428-.075-.127-.275-.202-.576-.352Z" />
    <path d="M12.004 2c-5.523 0-10 4.477-10 10a9.96 9.96 0 0 0 1.542 5.327L2 22l4.82-1.503A9.963 9.963 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10Zm0 18.2a8.16 8.16 0 0 1-4.164-1.139l-.299-.178-3.088.963.98-3.007-.195-.312A8.167 8.167 0 1 1 12.004 20.2Z" />
  </svg>
);

export const SOCIAL_ICONS = {
  youtube: YouTubeIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  x: XIcon,
  linkedin: LinkedInIcon,
  telegram: Send,
  whatsapp: WhatsAppIcon,
  website: Globe,
};
