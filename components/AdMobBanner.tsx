import React, { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface AdMobBannerProps {
    adUnitId?: string;
}

const AdMobBanner: React.FC<AdMobBannerProps> = ({
    // GOOGLE TEST ID (ALWAYS FILLS)
    // Replace this with 'ca-app-pub-2203695397498260/2515682739' before Store Release
    adUnitId = 'ca-app-pub-3940256099942544/6300978111'
}) => {
    const [isAdLoaded, setIsAdLoaded] = useState(false);

    useEffect(() => {
        // Only run on native platforms (Android/iOS)
        if (!Capacitor.isNativePlatform()) {
            console.log('AdMob skipped: Web platform detected');
            return;
        }

        const initAdMob = async () => {
            try {
                // Initialize
                await AdMob.initialize();

                // Set up listeners
                AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
                    setIsAdLoaded(true);
                });

                // Show Banner
                await AdMob.showBanner({
                    adId: adUnitId,
                    adSize: BannerAdSize.BANNER,
                    position: BannerAdPosition.BOTTOM_CENTER,
                    margin: 0,
                    isTesting: true
                });

            } catch (error) {
                console.error('AdMob initialization failed', error);
            }
        };

        initAdMob();

        return () => {
            if (Capacitor.isNativePlatform()) {
                AdMob.hideBanner().catch(console.error);
                AdMob.removeBanner().catch(console.error);
            }
        };
    }, [adUnitId]);

    if (!Capacitor.isNativePlatform()) {
        // Optional: Placeholder for web preview if desired, or null
        return null;
    }

    // The banner is overlayed by the native layer, so we might need a spacer or not.
    // Usually, AdMob banner overlays the webview content at the bottom.
    // So we need to ensure our content has enough padding at the bottom so it's not covered.
    return (
        <div style={{ height: '50px', width: '100%', pointerEvents: 'none' }} />
    );
};

export default AdMobBanner;
