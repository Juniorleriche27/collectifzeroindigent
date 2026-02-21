export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    CompositeTypes: Record<string, never>;
    Enums: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      commune: {
        Insert: {
          id?: string;
          name: string;
          prefecture_id: string;
        };
        Relationships: [];
        Row: {
          id: string;
          name: string;
          prefecture_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          prefecture_id?: string;
        };
      };
      member: {
        Insert: {
          association_name?: string | null;
          commune_id: string;
          created_at?: string | null;
          email?: string | null;
          enterprise_name?: string | null;
          first_name: string;
          id?: string;
          join_mode: string;
          last_name: string;
          organisation_id?: string | null;
          org_name?: string | null;
          phone: string;
          prefecture_id: string;
          region_id: string;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Relationships: [];
        Row: {
          association_name: string | null;
          commune_id: string;
          created_at: string | null;
          email: string | null;
          enterprise_name: string | null;
          first_name: string | null;
          id: string;
          join_mode: string | null;
          last_name: string | null;
          organisation_id: string | null;
          org_name: string | null;
          phone: string | null;
          prefecture_id: string;
          region_id: string;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Update: {
          association_name?: string | null;
          commune_id?: string;
          created_at?: string | null;
          email?: string | null;
          enterprise_name?: string | null;
          first_name?: string | null;
          id?: string;
          join_mode?: string | null;
          last_name?: string | null;
          organisation_id?: string | null;
          org_name?: string | null;
          phone?: string | null;
          prefecture_id?: string;
          region_id?: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      organisation: {
        Insert: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name: string;
          type: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          type: string;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          type?: string;
          updated_at?: string;
        };
      };
      organization: {
        Insert: { [key: string]: Json | null | undefined };
        Relationships: [];
        Row: { [key: string]: Json | null };
        Update: { [key: string]: Json | null | undefined };
      };
      prefecture: {
        Insert: {
          id?: string;
          name: string;
          region_id: string;
        };
        Relationships: [];
        Row: {
          id: string;
          name: string;
          region_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          region_id?: string;
        };
      };
      profile: {
        Insert: {
          member_id?: string | null;
          role?: string | null;
          user_id: string;
        };
        Relationships: [];
        Row: {
          member_id: string | null;
          role: string | null;
          user_id: string;
        };
        Update: {
          member_id?: string | null;
          role?: string | null;
          user_id?: string;
        };
      };
      region: {
        Insert: {
          id?: string;
          name: string;
        };
        Relationships: [];
        Row: {
          id: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
    };
    Views: Record<string, never>;
  };
};
