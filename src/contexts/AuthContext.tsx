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
  const profileFetchInProgress = useRef<string | null>(null);

  // Function to ensure profile exists and fetch it
  // Uses the database function that auto-creates missing profiles
  const ensureAndFetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('[Auth] ensureAndFetchProfile for user:', userId);

    try {
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('[Auth] Error fetching profile:', fetchError);
      }

      if (existingProfile) {
        console.log('[Auth] Profile found:', existingProfile.id);
        return existingProfile;
      }

      console.log('[Auth] Profile not found, calling ensure_profile_exists RPC');

      // Profile doesn't exist - use RPC to create it
      const { data: newProfile, error: rpcError } = await supabase
        .rpc('ensure_profile_exists');

      if (rpcError) {
        console.error('[Auth] Error calling ensure_profile_exists:', rpcError);

        // Fallback: Try direct insert (might fail due to RLS, but worth trying)
        console.log('[Auth] Attempting direct profile insert as fallback');
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            user_id: userId,
            email: (await supabase.auth.getUser()).data.user?.email || 'unknown@email.com',
            first_name: 'User',
            last_name: 'Name',
            role: 'student',
            status: 'pending'
          }])
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('[Auth] Direct insert failed:', insertError);
          return null;
        }

        if (insertedProfile) {
          console.log('[Auth] Profile created via direct insert');
          return insertedProfile;
        }
      } else if (newProfile && Array.isArray(newProfile) && newProfile.length > 0) {
        console.log('[Auth] Profile created/fetched via RPC:', newProfile[0]?.id);
        return newProfile[0];
      } else if (newProfile && !Array.isArray(newProfile)) {
        console.log('[Auth] Profile created/fetched via RPC:', newProfile?.id);
        return newProfile as Profile;
      }

      console.log('[Auth] Could not create profile');
      return null;
    } catch (err) {
      console.error('[Auth] Exception in ensureAndFetchProfile:', err);
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('[Auth] fetchProfile called for:', userId);
    if (profileFetchInProgress.current === userId) {
      console.log('[Auth] Profile fetch already in progress, skipping');
      return profile;
    }
    profileFetchInProgress.current = userId;

    try {
      const fetchedProfile = await ensureAndFetchProfile(userId);
      setProfile(fetchedProfile);
      return fetchedProfile;
    } finally {
      profileFetchInProgress.current = null;
    }
  }, [ensureAndFetchProfile, profile]);

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
      console.log('[Auth] Starting signUp for:', email);
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

      if (error) {
        console.error('[Auth] SignUp error:', error);
        throw error;
      }

      console.log('[Auth] SignUp successful, user:', data.user?.id);

      // Profile is created by database trigger, but let's verify
      if (data.user) {
        // Wait a moment for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 500));

        const profile = await ensureAndFetchProfile(data.user.id);
        if (profile) {
          console.log('[Auth] Profile verified/created for new user');
          setProfile(profile);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('[Auth] SignUp exception:', error);
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

      // Fetch or create profile
      let fetchedProfile: Profile | null = null;
      if (data.user) {
        console.log('[Auth] Ensuring profile exists for user:', data.user.id);
        fetchedProfile = await ensureAndFetchProfile(data.user.id);
        if (fetchedProfile) {
          console.log('[Auth] Profile ready:', fetchedProfile.id);
          setProfile(fetchedProfile);
        } else {
          console.error('[Auth] Failed to get/create profile');
        }
      }

      console.log('[Auth] signIn complete, profile:', fetchedProfile ? 'available' : 'null');
      return { error: null, profile: fetchedProfile };
    } catch (error) {
      console.error('[Auth] signIn exception:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    console.log('[Auth] Sign out complete');
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
      const freshProfile = await ensureAndFetchProfile(user.id);
      setProfile(freshProfile);
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
    refreshProfile,
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
