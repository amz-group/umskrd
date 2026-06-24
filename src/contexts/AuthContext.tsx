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
  const profileFetchInProgress = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[Auth] fetchProfile called for:', userId);
    if (profileFetchInProgress.current === userId) {
      console.log('[Auth] Profile fetch already in progress, skipping');
      return;
    }
    profileFetchInProgress.current = userId;

    try {
      console.log('[Auth] Querying profiles table for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Error fetching profile:', error);
        setProfile(null);
        return;
      }

      console.log('[Auth] Profile fetched successfully:', data ? 'found' : 'not found');
      setProfile(data);
    } catch (err) {
      console.error('[Auth] Exception fetching profile:', err);
      setProfile(null);
    } finally {
      profileFetchInProgress.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    console.log('[Auth] Starting initialization');

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Getting initial session');
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!mounted) {
          console.log('[Auth] Component unmounted during initialization');
          return;
        }

        console.log('[Auth] Initial session:', initialSession ? `user: ${initialSession.user?.id}` : 'null');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          console.log('[Auth] Found existing session, fetching profile');
          await fetchProfile(initialSession.user.id);
        }

        if (mounted) {
          console.log('[Auth] Setting loading to false');
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Error initializing auth:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    console.log('[Auth] Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[Auth] Auth state changed:', event, newSession ? `user: ${newSession.user?.id}` : 'null session');
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        console.log('[Auth] Ignoring INITIAL_SESSION event (already handled)');
        return;
      }

      console.log('[Auth] Processing auth state change, updating session/user');
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        console.log('[Auth] New session has user, fetching profile');
        fetchProfile(newSession.user.id);
      } else {
        console.log('[Auth] No user in session, clearing profile');
        setProfile(null);
      }
    });

    return () => {
      console.log('[Auth] Cleanup: unsubscribing and marking unmounted');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
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

      // Profile is automatically created by database trigger
      // Fallback: if the trigger somehow didn't create it, try manually
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const profileData = {
            id: data.user.id,
            user_id: data.user.id,
            email: data.user.email!,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'student',
            phone: userData.phone,
            gender: userData.gender,
            status: 'pending' as const,
          };

          await supabase.from('profiles').insert([profileData]);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Starting signIn for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] signInWithPassword error:', error);
        throw error;
      }

      console.log('[Auth] signInWithPassword success, user:', data.user?.id);

      // Update session and user immediately
      setSession(data.session);
      setUser(data.user);

      // Fetch profile before returning - this ensures the profile is ready
      // before the navigation happens
      let fetchedProfile: Profile | null = null;
      if (data.user) {
        console.log('[Auth] Fetching profile for user:', data.user.id);

        // Direct query without using fetchProfile to get the profile value
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[Auth] Profile query error:', profileError);
        } else {
          console.log('[Auth] Profile fetched:', profileData ? 'found' : 'not found');
          fetchedProfile = profileData;
          setProfile(profileData);
        }
      }

      console.log('[Auth] signIn complete');
      return { error: null, profile: fetchedProfile };
    } catch (error) {
      console.error('[Auth] signIn exception:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
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

  const isRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  }, [profile]);

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isRole,
  };

  return (
    <AuthContext.Provider value={value}>
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
