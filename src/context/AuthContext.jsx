import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        // Check active session on mount
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('Error signing in:', error);
            throw error;
        }

        return { success: true, message: 'Controlla la tua email per il link di accesso!' };
    };

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('Error signing up:', error);
            throw error;
        }

        // Check if email confirmation is required
        if (data?.user?.identities?.length === 0) {
            throw new Error('Questa email è già registrata. Prova ad accedere.');
        }

        return { success: true, message: 'Controlla la tua email per confermare l\'account prima di accedere.' };
    };

    const signInWithPassword = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Error signing in:', error);
            throw error;
        }

        return { success: true };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });

        if (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signInWithEmail,
        signUp,
        signInWithPassword,
        signInWithGoogle,
        signOut,
        showLoginModal,
        setShowLoginModal
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
