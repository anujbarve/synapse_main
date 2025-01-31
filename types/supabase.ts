export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      channels: {
        Row: {
          community_id: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          community_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          community_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          downvotes: number | null
          id: number
          parent_id: number | null
          post_id: number
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          downvotes?: number | null
          id?: number
          parent_id?: number | null
          post_id: number
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          downvotes?: number | null
          id?: number
          parent_id?: number | null
          post_id?: number
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community: {
        Row: {
          banner_picture: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: number
          is_private: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          banner_picture?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: number
          is_private?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          banner_picture?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: number
          is_private?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: number
          id: number
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: number
          id?: number
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: number
          id?: number
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          community_id: number | null
          content: string
          file_url: string | null
          id: number
          is_read: boolean | null
          message_type: string | null
          receiver_id: string | null
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          community_id?: number | null
          content: string
          file_url?: string | null
          id?: number
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          community_id?: number | null
          content?: string
          file_url?: string | null
          id?: number
          is_read?: boolean | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string | null
          actioned_at: string | null
          community_id: number
          details: string | null
          id: number
          user_id: string
        }
        Insert: {
          action?: string | null
          actioned_at?: string | null
          community_id: number
          details?: string | null
          id?: number
          user_id: string
        }
        Update: {
          action?: string | null
          actioned_at?: string | null
          community_id?: number
          details?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: number
          is_read: boolean | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          created_at: string
          id: number
          post_id: number
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: number
          post_id: number
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: number
          post_id?: number
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          community_id: number
          content: string
          created_at: string
          downvotes: number
          id: number
          title: string
          type: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          community_id: number
          content: string
          created_at?: string
          downvotes?: number
          id?: number
          title: string
          type: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          community_id?: number
          content?: string
          created_at?: string
          downvotes?: number
          id?: number
          title?: string
          type?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_history: {
        Row: {
          change_value: number
          changed_at: string | null
          changed_by: string | null
          id: number
          reason: string | null
          user_id: string
        }
        Insert: {
          change_value: number
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          change_value?: number
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          file_name: string
          file_url: string
          id: number
          room_id: number
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: number
          room_id: number
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: number
          room_id?: number
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string
          id: string
          profile_picture: string | null
          reputation: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          profile_picture?: string | null
          reputation?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          profile_picture?: string | null
          reputation?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_community_channels: {
        Args: {
          p_community_id: number
          p_created_by: string
        }
        Returns: undefined
      }
      increment_downvotes: {
        Args: {
          post_id: number
        }
        Returns: undefined
      }
      increment_upvotes: {
        Args: {
          post_id: number
        }
        Returns: undefined
      }
      mark_inactive_users_offline: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      channel_type: "text" | "audio" | "video"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
