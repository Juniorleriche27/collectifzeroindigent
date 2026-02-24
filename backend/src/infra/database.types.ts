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
    Enums: {
      conversation_community_kind:
        | 'czi'
        | 'engaged'
        | 'entrepreneur'
        | 'org_leader';
      conversation_type: 'community' | 'direct';
      email_campaign_status: 'draft' | 'queued' | 'sent' | 'failed';
      email_recipient_status: 'pending' | 'sent' | 'failed' | 'skipped';
      scope_level: 'all' | 'region' | 'prefecture' | 'commune';
    };
    Functions: {
      can_access_conversation: {
        Args: { conversation_uuid: string };
        Returns: boolean;
      };
      can_post_conversation: {
        Args: { conversation_uuid: string; sender_member_uuid: string };
        Returns: boolean;
      };
      current_member_commune_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_member_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_member_prefecture_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_member_region_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_communication_manager: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      member_in_community_kind: {
        Args: {
          target_kind: Database['public']['Enums']['conversation_community_kind'];
        };
        Returns: boolean;
      };
      scope_matches_member: {
        Args: {
          scope_commune_id: string | null;
          scope_kind: Database['public']['Enums']['scope_level'];
          scope_prefecture_id: string | null;
          scope_region_id: string | null;
        };
        Returns: boolean;
      };
    };
    Tables: {
      announcement: {
        Insert: {
          body: string;
          created_at?: string;
          created_by: string;
          id?: string;
          is_published?: boolean;
          title: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          id: string;
          is_published: boolean;
          title: string;
          updated_at: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_published?: boolean;
          title?: string;
          updated_at?: string;
        };
      };
      announcement_scope: {
        Insert: {
          announcement_id: string;
          commune_id?: string | null;
          created_at?: string;
          id?: string;
          prefecture_id?: string | null;
          region_id?: string | null;
          scope_type: Database['public']['Enums']['scope_level'];
        };
        Relationships: [];
        Row: {
          announcement_id: string;
          commune_id: string | null;
          created_at: string;
          id: string;
          prefecture_id: string | null;
          region_id: string | null;
          scope_type: Database['public']['Enums']['scope_level'];
        };
        Update: {
          announcement_id?: string;
          commune_id?: string | null;
          created_at?: string;
          id?: string;
          prefecture_id?: string | null;
          region_id?: string | null;
          scope_type?: Database['public']['Enums']['scope_level'];
        };
      };
      communication_team: {
        Insert: {
          can_publish?: boolean;
          can_send_email?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          user_id: string;
        };
        Relationships: [];
        Row: {
          can_publish: boolean;
          can_send_email: boolean;
          created_at: string;
          created_by: string | null;
          id: string;
          user_id: string;
        };
        Update: {
          can_publish?: boolean;
          can_send_email?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          user_id?: string;
        };
      };
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
      conversation: {
        Insert: {
          commune_id?: string | null;
          community_kind?:
            | Database['public']['Enums']['conversation_community_kind']
            | null;
          conversation_type: Database['public']['Enums']['conversation_type'];
          created_at?: string;
          created_by: string;
          id?: string;
          parent_conversation_id?: string | null;
          prefecture_id?: string | null;
          region_id?: string | null;
          scope_type?: Database['public']['Enums']['scope_level'];
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          commune_id: string | null;
          community_kind:
            | Database['public']['Enums']['conversation_community_kind']
            | null;
          conversation_type: Database['public']['Enums']['conversation_type'];
          created_at: string;
          created_by: string;
          id: string;
          parent_conversation_id: string | null;
          prefecture_id: string | null;
          region_id: string | null;
          scope_type: Database['public']['Enums']['scope_level'];
          title: string | null;
          updated_at: string;
        };
        Update: {
          commune_id?: string | null;
          community_kind?:
            | Database['public']['Enums']['conversation_community_kind']
            | null;
          conversation_type?: Database['public']['Enums']['conversation_type'];
          created_at?: string;
          created_by?: string;
          id?: string;
          parent_conversation_id?: string | null;
          prefecture_id?: string | null;
          region_id?: string | null;
          scope_type?: Database['public']['Enums']['scope_level'];
          title?: string | null;
          updated_at?: string;
        };
      };
      conversation_participant: {
        Insert: {
          can_post?: boolean;
          conversation_id: string;
          id?: string;
          joined_at?: string;
          member_id: string;
        };
        Relationships: [];
        Row: {
          can_post: boolean;
          conversation_id: string;
          id: string;
          joined_at: string;
          member_id: string;
        };
        Update: {
          can_post?: boolean;
          conversation_id?: string;
          id?: string;
          joined_at?: string;
          member_id?: string;
        };
      };
      email_campaign: {
        Insert: {
          audience_scope?: Database['public']['Enums']['scope_level'];
          body: string;
          commune_id?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          prefecture_id?: string | null;
          provider?: string | null;
          region_id?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['email_campaign_status'];
          subject: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          audience_scope: Database['public']['Enums']['scope_level'];
          body: string;
          commune_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          prefecture_id: string | null;
          provider: string | null;
          region_id: string | null;
          scheduled_at: string | null;
          sent_at: string | null;
          status: Database['public']['Enums']['email_campaign_status'];
          subject: string;
          updated_at: string;
        };
        Update: {
          audience_scope?: Database['public']['Enums']['scope_level'];
          body?: string;
          commune_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          prefecture_id?: string | null;
          provider?: string | null;
          region_id?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['email_campaign_status'];
          subject?: string;
          updated_at?: string;
        };
      };
      email_campaign_recipient: {
        Insert: {
          campaign_id: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          member_id?: string | null;
          recipient_email: string;
          sent_at?: string | null;
          status?: Database['public']['Enums']['email_recipient_status'];
        };
        Relationships: [];
        Row: {
          campaign_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          member_id: string | null;
          recipient_email: string;
          sent_at: string | null;
          status: Database['public']['Enums']['email_recipient_status'];
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          member_id?: string | null;
          recipient_email?: string;
          sent_at?: string | null;
          status?: Database['public']['Enums']['email_recipient_status'];
        };
      };
      member: {
        Insert: {
          age_range?: string | null;
          association_name?: string | null;
          availability?: string | null;
          birth_date?: string | null;
          business_needs?: string[] | null;
          business_sector?: string | null;
          business_stage?: string | null;
          cellule_primary?: string;
          cellule_secondary?: string | null;
          commune_id: string;
          consent_ai_training_agg?: boolean | null;
          consent_analytics?: boolean | null;
          consent_terms?: boolean | null;
          contact_preference?: string | null;
          created_at?: string | null;
          education_level?: string | null;
          email?: string | null;
          engagement_domains?: string[] | null;
          engagement_frequency?: string | null;
          engagement_recent_action?: string | null;
          enterprise_name?: string | null;
          first_name: string;
          gender?: string | null;
          goal_3_6_months?: string | null;
          id?: string;
          interests?: string[] | null;
          join_mode: string;
          last_name: string;
          locality?: string | null;
          mobility?: boolean | null;
          mobility_zones?: string | null;
          odd_priorities?: number[] | null;
          organisation_id?: string | null;
          org_name?: string | null;
          org_name_declared?: string | null;
          org_role?: string | null;
          org_type?: string | null;
          partner_request?: boolean | null;
          phone: string;
          prefecture_id: string;
          profession_title?: string | null;
          region_id: string;
          skills?: Json | null;
          status?: string | null;
          support_types?: string[] | null;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_reason?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Relationships: [];
        Row: {
          age_range: string | null;
          association_name: string | null;
          availability: string | null;
          birth_date: string | null;
          business_needs: string[] | null;
          business_sector: string | null;
          business_stage: string | null;
          cellule_primary: string;
          cellule_secondary: string | null;
          commune_id: string;
          consent_ai_training_agg: boolean | null;
          consent_analytics: boolean | null;
          consent_terms: boolean | null;
          contact_preference: string | null;
          created_at: string | null;
          education_level: string | null;
          email: string | null;
          engagement_domains: string[] | null;
          engagement_frequency: string | null;
          engagement_recent_action: string | null;
          enterprise_name: string | null;
          first_name: string | null;
          gender: string | null;
          goal_3_6_months: string | null;
          id: string;
          interests: string[] | null;
          join_mode: string | null;
          last_name: string | null;
          locality: string | null;
          mobility: boolean | null;
          mobility_zones: string | null;
          odd_priorities: number[] | null;
          organisation_id: string | null;
          org_name: string | null;
          org_name_declared: string | null;
          org_role: string | null;
          org_type: string | null;
          partner_request: boolean | null;
          phone: string | null;
          prefecture_id: string;
          profession_title: string | null;
          region_id: string;
          skills: Json | null;
          status: string | null;
          support_types: string[] | null;
          validated_at: string | null;
          validated_by: string | null;
          validation_reason: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Update: {
          age_range?: string | null;
          association_name?: string | null;
          availability?: string | null;
          birth_date?: string | null;
          business_needs?: string[] | null;
          business_sector?: string | null;
          business_stage?: string | null;
          cellule_primary?: string;
          cellule_secondary?: string | null;
          commune_id?: string;
          consent_ai_training_agg?: boolean | null;
          consent_analytics?: boolean | null;
          consent_terms?: boolean | null;
          contact_preference?: string | null;
          created_at?: string | null;
          education_level?: string | null;
          email?: string | null;
          engagement_domains?: string[] | null;
          engagement_frequency?: string | null;
          engagement_recent_action?: string | null;
          enterprise_name?: string | null;
          first_name?: string | null;
          gender?: string | null;
          goal_3_6_months?: string | null;
          id?: string;
          interests?: string[] | null;
          join_mode?: string | null;
          last_name?: string | null;
          locality?: string | null;
          mobility?: boolean | null;
          mobility_zones?: string | null;
          odd_priorities?: number[] | null;
          organisation_id?: string | null;
          org_name?: string | null;
          org_name_declared?: string | null;
          org_role?: string | null;
          org_type?: string | null;
          partner_request?: boolean | null;
          phone?: string | null;
          prefecture_id?: string;
          profession_title?: string | null;
          region_id?: string;
          skills?: Json | null;
          status?: string | null;
          support_types?: string[] | null;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_reason?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      message: {
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: string;
          mention_member_ids?: string[] | null;
          parent_message_id?: string | null;
          sender_member_id: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          deleted_at: string | null;
          edited_at: string | null;
          id: string;
          mention_member_ids: string[] | null;
          parent_message_id: string | null;
          sender_member_id: string;
          updated_at: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: string;
          mention_member_ids?: string[] | null;
          parent_message_id?: string | null;
          sender_member_id?: string;
          updated_at?: string;
        };
      };
      message_like: {
        Insert: {
          created_at?: string;
          id?: string;
          member_id: string;
          message_id: string;
          reaction?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          id: string;
          member_id: string;
          message_id: string;
          reaction: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          member_id?: string;
          message_id?: string;
          reaction?: string;
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
