// GoogleApiContext.tsx
// Fix: Add declaration for gapi to provide a type for the globally available Google API object.
declare const gapi: any;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initGapiClient, initGisClient, handleSignIn, handleSignOut } from './googleApi.ts';

interface GoogleApiContextType {
    isGapiLoaded: boolean;
    isGisLoaded: boolean;
    isSignedIn: boolean;
    initError: string | null;
    signIn: () => void;
    signOut: () => void;
}

const GoogleApiContext = createContext<GoogleApiContextType | undefined>(undefined);

export const GoogleApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isGapiLoaded, setIsGapiLoaded] = useState(false);
    const [isGisLoaded, setIsGisLoaded] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        const loadApis = () => {
            // Check if GAPI script is already loaded
            const existingGapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');

            if (existingGapiScript) {
                // Script already exists, check if gapi is ready
                if (typeof gapi !== 'undefined' && gapi.client) {
                    setIsGapiLoaded(true);
                } else {
                    // Wait for the existing script to load
                    existingGapiScript.addEventListener('load', () => {
                        gapi.load('client', async () => {
                            try {
                                await initGapiClient();
                                setIsGapiLoaded(true);
                            } catch (error: any) {
                                handleGapiError(error);
                            }
                        });
                    });
                }
            } else {
                // Load the GAPI client
                const gapiScript = document.createElement('script');
                gapiScript.src = 'https://apis.google.com/js/api.js';
                gapiScript.async = true;
                gapiScript.defer = true;
                gapiScript.onload = () => {
                    gapi.load('client', async () => {
                        try {
                            await initGapiClient();
                            setIsGapiLoaded(true);
                        } catch (error: any) {
                            handleGapiError(error);
                        }
                    });
                };
                document.body.appendChild(gapiScript);
            }

            // Check if GIS script is already loaded
            const existingGisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

            if (existingGisScript) {
                // Script already exists, initialize if ready
                if (typeof google !== 'undefined' && google.accounts) {
                    initGisClient((tokenResponse) => {
                        handleGisCallback(tokenResponse);
                    });
                    setIsGisLoaded(true);
                } else {
                    // Wait for the existing script to load
                    existingGisScript.addEventListener('load', () => {
                        initGisClient((tokenResponse) => {
                            handleGisCallback(tokenResponse);
                        });
                        setIsGisLoaded(true);
                    });
                }
            } else {
                // Load the GIS client
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.async = true;
                gisScript.defer = true;
                gisScript.onload = () => {
                    initGisClient((tokenResponse) => {
                        handleGisCallback(tokenResponse);
                    });
                    setIsGisLoaded(true);
                };
                document.body.appendChild(gisScript);
            }
        };

        const handleGapiError = (error: any) => {
            let errorMessage = "An unknown error occurred during Google API client initialization.";
            if (error && typeof error === 'object') {
                const apiError = error.error || (error.result && error.result.error);
                if (apiError && apiError.message) {
                    errorMessage = `API Error: ${apiError.message} (Code: ${apiError.code}). Please ensure your Google Cloud project is configured correctly and your organization has a BAA with Google for HIPAA compliance.`;
                } else {
                    errorMessage = `Unexpected error structure: ${JSON.stringify(error, null, 2)}`;
                }
            }
            console.error("Error initializing Google API client:", errorMessage);
            setInitError(errorMessage);
        };

        const handleGisCallback = (tokenResponse: any) => {
            if (tokenResponse.error) {
                console.error('GIS Error:', tokenResponse.error);
                setIsSignedIn(false);
            } else {
                gapi.client.setToken(tokenResponse);
                setIsSignedIn(true);
            }
        };

        loadApis();
    }, []);

    const signIn = () => {
        handleSignIn();
    };

    const signOut = () => {
        handleSignOut();
        setIsSignedIn(false);
    };

    return (
        <GoogleApiContext.Provider value={{ isGapiLoaded, isGisLoaded, isSignedIn, initError, signIn, signOut }}>
            {children}
        </GoogleApiContext.Provider>
    );
};

export const useGoogleApi = () => {
    const context = useContext(GoogleApiContext);
    if (context === undefined) {
        throw new Error('useGoogleApi must be used within a GoogleApiProvider');
    }
    return context;
};