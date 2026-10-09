import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';
import { Profile } from '@/types/database';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profileData) {
              setProfile(profileData);
            } else {
              setProfile({
                id: session.user.id,
                email: session.user.email || null,
                full_name: session.user.user_metadata?.full_name || null,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('Supabase session initialization error:', err);
        }

        const client = supabase;
        // Listen for auth state changes
        const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            const { data } = await client.from('profiles').select('*').eq('id', session.user.id).single();
            if (data) setProfile(data);
          } else {
            setUser(null);
            setProfile(null);
          }
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Fallback to local session persistence
        const savedAuth = localStorage.getItem('localflow_session');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            setUser(parsed.user);
            setProfile(localDb.getProfile());
          } catch {
            localStorage.removeItem('localflow_session');
          }
        } else {
          // Default demo session for immediate exploration
          const demoProfile = localDb.getProfile();
          const demoUser: AuthUser = {
            id: demoProfile.id,
            email: demoProfile.email || 'marcus@apexhvac.example.com',
          };
          setUser(demoUser);
          setProfile(demoProfile);
          localStorage.setItem('localflow_session', JSON.stringify({ user: demoUser }));
        }
        setLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const signIn = async (email: string, password?: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'Password123!',
      });
      return { error: error as Error | null };
    } else {
      // Local demo sign in
      const demoUser: AuthUser = { id: 'user-apex-owner-001', email };
      const demoProfile = localDb.getProfile();
      demoProfile.email = email;
      localDb.saveProfile(demoProfile);
      setUser(demoUser);
      setProfile(demoProfile);
      localStorage.setItem('localflow_session', JSON.stringify({ user: demoUser }));
      return { error: null };
    }
  };

  const signUp = async (email: string, password?: string, fullName?: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'Password123!',
        options: {
          data: { full_name: fullName },
        },
      });
      if (!error && data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return { error: error as Error | null };
    } else {
      // Local demo sign up
      const newId = `user-${Date.now()}`;
      const newUser: AuthUser = { id: newId, email };
      const newProfile: Profile = {
        id: newId,
        full_name: fullName || 'New Business Owner',
        email,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localDb.saveProfile(newProfile);
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem('localflow_session', JSON.stringify({ user: newUser }));
      return { error: null };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('localflow_session');
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      return { error: error as Error | null };
    } else {
      // Local simulated password reset
      return { error: null };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error('No profile loaded') };
    const updated: Profile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').update(updated).eq('id', profile.id);
      if (!error) setProfile(updated);
      return { error: error as Error | null };
    } else {
      localDb.saveProfile(updated);
      setProfile(updated);
      return { error: null };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
