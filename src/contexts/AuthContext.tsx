import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  isRole: (roles: UserRole | UserRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone?: string;
  gender?: 'male' | 'female';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Simple profile fetch - just query by ID
  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('[Auth] getProfile for user:', userId);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile query error:', error.message, error.code, error.details);
        return null;
      }

      console.log('[Auth] Profile query result:', data ? 'found' : 'not found');
      return data;
    } catch (err) {
      console.error('[Auth] Profile query exception:', err);
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    let mounted = true;

    const init = async () => {
      console.log('[Auth] Initializing...');
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        console.log('[Auth] Initial session:', existingSession ? 'found' : 'none');
        setSession(existingSession);
        setUser(existingSession?.user ?? null);

        if (existingSession?.user) {
          const profileData = await getProfile(existingSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] State change:', event);
      if (!mounted) return;

      // Skip INITIAL_SESSION - we already handled it in init()
      if (event === 'INITIAL_SESSION') return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profileData = await getProfile(newSession.user.id);
        if (mounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getProfile]);

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      console.log('[Auth] signUp:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'student',
            phone: userData.phone,
            gender: userData.gender,
          },
        },
      });

      if (error) throw error;

      console.log('[Auth] signUp success, user:', data.user?.id);

      // Wait for trigger to create profile
      if (data.user) {
        let retries = 0;
        let profileData: Profile | null = null;

        while (retries < 10 && !profileData) {
          await new Promise(r => setTimeout(r, 300));
          profileData = await getProfile(data.user!.id);
          retries++;
        }

        if (profileData) {
          setProfile(profileData);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] signUp error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] signIn:', email);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      console.log('[Auth] signIn success, user:', data.user?.id);

      // Update state immediately
      setSession(data.session);
      setUser(data.user);

      // Now fetch the profile - with retries
      let profileData: Profile | null = null;

      if (data.user) {
        // Try up to 5 times with delays
        for (let i = 0; i < 5; i++) {
          profileData = await getProfile(data.user.id);
          if (profileData) break;

          console.log(`[Auth] Profile fetch attempt ${i + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 200));
        }

        if (profileData) {
          console.log('[Auth] Profile loaded:', profileData.id);
          setProfile(profileData);
        } else {
          console.error('[Auth] Profile not found after all retries');
        }
      }

      return { error: null, profile: profileData };
    } catch (error) {
      console.error('[Auth] signIn error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    console.log('[Auth] signOut');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await getProfile(user.id);
      setProfile(profileData);
    }
  };

  const isRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        isRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
