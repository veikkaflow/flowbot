
// components/Icons.tsx
import React from 'react';

// A generic icon creator for simplicity
const createIcon = (d: string) => (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d={d} />
    </svg>
);

export const Smile = createIcon("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01");
export const Plus = createIcon("M12 5v14m-7-7h14");
export const Trash2 = createIcon("M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6");
export const HelpCircle = createIcon("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01");
export const MessageSquare = createIcon("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
export const Settings = createIcon("M12.22 2h-4.44l-1.94 1.94a.5.5 0 0 1-.7.09L3.46 3.46a.5.5 0 0 0-.71 0L2 4.17a.5.5 0 0 0 0 .71l.53.53a.5.5 0 0 1 .09.7L2 7.78v4.44l1.94 1.94a.5.5 0 0 1 .09.7l-.53.53a.5.5 0 0 0 0 .71l.71.71a.5.5 0 0 0 .71 0l1.62-1.62a.5.5 0 0 1 .7.09L7.78 22h4.44l1.94-1.94a.5.5 0 0 1 .7-.09l1.62 1.62a.5.5 0 0 0 .71 0l.71-.71a.5.5 0 0 0 0-.71l-.53-.53a.5.5 0 0 1-.09-.7L22 12.22V7.78l-1.94-1.94a.5.5 0 0 1-.09-.7l.53-.53a.5.5 0 0 0 0-.71l-.71-.71a.5.5 0 0 0-.71 0L14.54 4.6a.5.5 0 0 1-.7-.09L12.22 2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z");
export const Shield = createIcon("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
export const Book = createIcon("M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 19.5zM4 5h16v12H6.5A3.5 3.5 0 0 0 3 13.5V5z");
export const Clock = createIcon("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2");
export const Users = createIcon("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 10v-2a4 4 0 0 0-3-3.87m-2-11a4 4 0 0 1 0 8");
export const Palette = createIcon("M13.5 6.5L17.5 2.5C18.428 1.571 20.286 1.571 21.214 2.5C22.143 3.429 22.143 5.286 21.214 6.214L17.5 10.5M13.5 6.5L10 10L2.5 17.5C1.571 18.428 1.571 20.286 2.5 21.214C3.429 22.143 5.286 22.143 6.214 21.214L13.5 14L17.5 10.5M13.5 6.5L17.5 10.5M4 20L10.5 13.5");
export const LayoutColumns = createIcon("M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18");
export const Monitor = createIcon("M8 17h8v4H8zM4 4h16v9H4z");
export const ChevronsUpDown = createIcon("M7 15l5 5 5-5M7 9l5-5 5 5");
export const LogOut = createIcon("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9");
export const Check = createIcon("M20 6L9 17l-5-5");
export const Home = createIcon("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z");
export const Mail = createIcon("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM4 6v.41l8 4.8 8-4.8V6H4z");
export const BarChart2 = createIcon("M18 20V10m-6 10V4M6 20v-6");
export const User = createIcon("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z");
export const Bot = createIcon("M12 8V4H8v4H4v8h4v4h4v-4h4V8h-4zM8 12h8");
export const UserCheck = createIcon("M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 3l2 2 4-4");
export const Send = createIcon("M22 2L11 13 2 9l-2 9 9-2 4 9z");
export const UserX = createIcon("M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8-2l-6 6m0-6l6 6");
export const Calendar = createIcon("M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z");
export const X = createIcon("M18 6L6 18M6 6l12 12");
export const PlusSquare = createIcon("M12 9v6m3-3H9m9 9H3V3h18v18z");
export const Loader = createIcon("M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4m-2.83-8.48l-2.83 2.83M19.07 19.07l-2.83-2.83");
export const RefreshCcw = createIcon("M1 4v6h6m16 10v-6h-6M21 9.92A9 9 0 0 0 3.51 5.9M3 14.08A9 9 0 0 0 20.49 18.1");
export const ArrowLeft = createIcon("M19 12H5m7 7l-7-7 7-7");
export const ArrowDown = createIcon("M12 5v14m-7-7l7 7 7-7");
export const UploadCloud = createIcon("M16 16v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3m16 4h-4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2zM12 12V2m-4 6l4-4 4 4");
export const FileText = createIcon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM9 18H6M16 13H6M16 9H9");
export const Edit2 = createIcon("M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z");
export const AlertTriangle = createIcon("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01");
export const Info = createIcon("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4m0-4h.01");
export const Archive = createIcon("M21 8v13H3V8M1 3h22v5H1zM10 12h4");
export const Zap = createIcon("M13 2L3 14h9l-1 8 10-12h-9l1-8z");
export const Lock = createIcon("M7 11V7a5 5 0 0 1 10 0v4M5 21h14a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z");
export const Briefcase = createIcon("M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16m-6 0H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4");
export const Image = createIcon("M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm14 15H5.01L5 5h14v13zM9 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-2 4l3-3 5 5h-8l3-3z");
export const List = createIcon("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01");
export const ExternalLink = createIcon("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3");

// Special BrandLogo component
export const BrandLogo: React.FC<{ logoUrl?: string; className?: string }> = ({ logoUrl, className }) => {
    if (logoUrl) {
        return <img src={logoUrl} alt="Brand Logo" className={className} />;
    }
    // Fallback Icon
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'var(--color-primary, #3b82f6)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-primary-light, #60a5fa)', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path d="M12 2L12 2C17.5228 2 22 6.47715 22 12V18C22 19.1046 21.1046 20 20 20H13.25C13.25 20 13 20.0761 13 20.25C13 20.4239 12.5523 21.9239 11 21.99C9.44772 21.9239 9 20.4239 9 20.25C9 20.0761 8.75 20 8.75 20H4C2.89543 20 2 19.1046 2 18V12C2 6.47715 6.47715 2 12 2Z" fill="url(#grad1)" fillOpacity="0.2"/>
            <path d="M16.5 12H13.5V8.5C13.5 7.67157 12.8284 7 12 7C11.1716 7 10.5 7.67157 10.5 8.5V12H7.5" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};
