import React, { createContext, useContext, useState, useEffect } from 'react';
import { Workspace, WorkspaceMember } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  loading: boolean;
  memberRole: 'owner' | 'admin' | 'member';
  updateWorkspace: (updates: Partial<Workspace>) => Promise<{ error: Error | null }>;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [memberRole, setMemberRole] = useState<'owner' | 'admin' | 'member'>('owner');
  const [loading, setLoading] = useState(true);

  const loadWorkspace = async () => {
    if (!user) {
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch workspace membership
        const { data: membershipData } = await supabase
          .from('workspace_members')
          .select('workspace_id, role, workspaces(*)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (membershipData && membershipData.workspaces) {
          const ws = membershipData.workspaces as unknown as Workspace;
          setCurrentWorkspace(ws);
          setMemberRole(membershipData.role as 'owner' | 'admin' | 'member');
        } else {
          // If no workspace exists yet, create default one
          const newWorkspace: Partial<Workspace> = {
            name: 'My Service Business',
            category: 'General Services',
            currency: 'USD',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            plan: 'starter',
            owner_id: user.id,
          };
          const { data: createdWs } = await supabase
            .from('workspaces')
            .insert(newWorkspace)
            .select('*')
            .single();

          if (createdWs) {
            await supabase.from('workspace_members').insert({
              workspace_id: createdWs.id,
              user_id: user.id,
              role: 'owner',
            });
            setCurrentWorkspace(createdWs);
            setMemberRole('owner');
          }
        }
      } catch (err) {
        console.error('Error loading Supabase workspace:', err);
      }
      setLoading(false);
    } else {
      // Local workspace
      const ws = localDb.getWorkspace();
      setCurrentWorkspace(ws);
      setMemberRole('owner');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [user]);

  const updateWorkspace = async (updates: Partial<Workspace>) => {
    if (!currentWorkspace) return { error: new Error('No workspace active') };

    const updated: Workspace = {
      ...currentWorkspace,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('workspaces')
        .update(updated)
        .eq('id', currentWorkspace.id);
      if (!error) {
        setCurrentWorkspace(updated);
      }
      return { error: error as Error | null };
    } else {
      localDb.saveWorkspace(updated);
      setCurrentWorkspace(updated);
      return { error: null };
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        loading,
        memberRole,
        updateWorkspace,
        refreshWorkspace: loadWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
