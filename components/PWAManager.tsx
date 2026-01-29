
import React, { useEffect } from 'react';
import { Academy } from '../types';

interface PWAManagerProps {
    academy: Academy | null;
}

export const PWAManager: React.FC<PWAManagerProps> = ({ academy }) => {
    useEffect(() => {
        const name = academy ? `${academy.name} Card Pass` : 'Matkeep';
        const shortName = academy ? academy.name : 'Matkeep';
        const icon = academy?.logoUrl || '/icon-512.png';

        const manifest = {
            name: name,
            short_name: shortName,
            description: "Smart System for Academy and Student Management",
            start_url: window.location.href,
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#111827",
            icons: [
                {
                    src: icon,
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any maskable"
                }
            ]
        };

        const stringManifest = JSON.stringify(manifest);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);

        let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'manifest';
            document.head.appendChild(link);
        }
        link.href = manifestURL;

        // Atualiza também o Apple Touch Icon (para iPhones)
        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            document.head.appendChild(appleIcon);
        }
        appleIcon.href = icon;

        // Atualiza o Título da Página dinamicamente
        document.title = name;

        return () => {
            URL.revokeObjectURL(manifestURL);
        };
    }, [academy]);

    return null;
};
