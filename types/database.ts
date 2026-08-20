export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_seed: string;
          plan: "free" | "plus" | "pro";
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_seed?: string;
          plan?: "free" | "plus" | "pro";
        };
        Update: {
          display_name?: string;
          avatar_seed?: string;
          plan?: "free" | "plus" | "pro";
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          icon: string;
          description: string;
          default_ambience: string;
          is_premium: boolean;
          sort_order: number;
          created_by: string | null;
          visibility: "public" | "private";
          join_policy: "open" | "approval_required" | "invite_only";
          is_system: boolean;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          description: string;
          default_ambience?: string;
          is_premium?: boolean;
          sort_order?: number;
          created_by?: string | null;
          visibility?: "public" | "private";
          join_policy?: "open" | "approval_required" | "invite_only";
          is_system?: boolean;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          name?: string;
          icon?: string;
          description?: string;
          default_ambience?: string;
          is_premium?: boolean;
          sort_order?: number;
          visibility?: "public" | "private";
          join_policy?: "open" | "approval_required" | "invite_only";
          archived_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          room_id: string;
          task: string | null;
          duration_seconds: number;
          completed: boolean;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          user_id: string;
          room_id: string;
          task?: string | null;
          duration_seconds: number;
          completed?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          completed?: boolean;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      murmurs: {
        Row: {
          id: string;
          user_id: string | null;
          room_id: string;
          display_name: string;
          text: string;
          created_at: string;
          is_guest: boolean;
        };
        Insert: {
          user_id: string;
          room_id: string;
          display_name: string;
          text: string;
          is_guest?: boolean;
        };
        Update: {
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "murmurs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "murmurs_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_session_date: string | null;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_session_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      private_rooms: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "private_rooms_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      room_members: {
        Row: { room_id: string; user_id: string; role: "owner" | "admin" | "member"; joined_at: string; };
        Insert: { room_id: string; user_id: string; role?: "owner" | "admin" | "member"; };
        Update: { role?: "owner" | "admin" | "member"; };
        Relationships: [];
      };
      room_join_requests: {
        Row: { id: string; room_id: string; user_id: string; status: "pending" | "approved" | "rejected" | "cancelled"; created_at: string; reviewed_at: string | null; reviewed_by: string | null; };
        Insert: { room_id: string; user_id: string; };
        Update: { status?: "pending" | "approved" | "rejected" | "cancelled"; };
        Relationships: [];
      };
      room_invites: {
        Row: { id: string; room_id: string; token: string; created_by: string; expires_at: string | null; max_uses: number | null; uses: number; revoked_at: string | null; created_at: string; };
        Insert: { room_id: string; created_by: string; expires_at?: string | null; max_uses?: number | null; };
        Update: { revoked_at?: string | null; };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_session: {
        Args: {
          p_room_id: string;
          p_task: string | null;
          p_duration_seconds: number;
        };
        Returns: Database["public"]["Tables"]["sessions"]["Row"];
      };
      public_cafe_stats: {
        Args: Record<string, never>;
        Returns: { completed_sessions: number; public_rooms: number };
      };
      preview_room_invite: {
        Args: { p_token: string };
        Returns: { room_id: string; name: string; icon: string; description: string; visibility: string };
      };
      update_study_group: {
        Args: { p_room_id: string; p_name: string; p_description: string; p_icon: string; p_default_ambience: string };
        Returns: Database["public"]["Tables"]["rooms"]["Row"];
      };
      archive_study_group: { Args: { p_room_id: string }; Returns: undefined; };
      leave_study_group: { Args: { p_room_id: string }; Returns: undefined; };
      remove_room_member: { Args: { p_room_id: string; p_user_id: string }; Returns: undefined; };
      set_room_member_role: { Args: { p_room_id: string; p_user_id: string; p_role: "admin" | "member" }; Returns: undefined; };
      revoke_room_invite: { Args: { p_invite_id: string }; Returns: undefined; };
      create_study_group: {
        Args: { p_name: string; p_description: string; p_icon: string; p_default_ambience: string; p_visibility: "public" | "private"; p_join_policy: "open" | "approval_required" | "invite_only"; };
        Returns: Database["public"]["Tables"]["rooms"]["Row"];
      };
      request_to_join_room: { Args: { p_room_id: string }; Returns: string; };
      review_room_join_request: { Args: { p_request_id: string; p_approve: boolean }; Returns: undefined; };
      create_room_invite: { Args: { p_room_id: string; p_expires_at?: string | null; p_max_uses?: number | null }; Returns: Database["public"]["Tables"]["room_invites"]["Row"]; };
      accept_room_invite: { Args: { p_token: string }; Returns: string; };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Murmur = Database["public"]["Tables"]["murmurs"]["Row"];
export type Streak = Database["public"]["Tables"]["streaks"]["Row"];
export type PrivateRoom = Database["public"]["Tables"]["private_rooms"]["Row"];

// Presence payload broadcast over Supabase Realtime — not persisted to a table
export interface PresenceState {
  user_id: string;
  display_name: string;
  avatar_seed: string;
  task: string;
  status: "active" | "break";
  session_started_at: string | null;
  is_guest?: boolean;
  is_me?: boolean;
}
