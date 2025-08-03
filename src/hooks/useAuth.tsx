import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: { username: string; email: string } | null;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // First check if email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email, username')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username
          }
        }
      });

      // Profile will be created automatically by database trigger
      return { error };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Get email from username
      const { data: emailData, error: emailError } = await supabase.rpc('get_user_by_username', {
        username_input: username
      });

      if (emailError || !emailData || emailData.length === 0) {
        return { error: { message: 'Username not found' } };
      }

      const email = emailData[0].email;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        username_input: username
      });
      
      if (error) {
        console.error('Error checking username:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    signUp,
    signIn,
    signOut,
    checkUsernameAvailability
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};