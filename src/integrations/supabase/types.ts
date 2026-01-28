export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          id: string
          is_mains_level: boolean | null
          jee_year: number
          name: string
          subject: string
        }
        Insert: {
          id?: string
          is_mains_level?: boolean | null
          jee_year: number
          name: string
          subject: string
        }
        Update: {
          id?: string
          is_mains_level?: boolean | null
          jee_year?: number
          name?: string
          subject?: string
        }
        Relationships: []
      }
      contest_participants: {
        Row: {
          contest_id: string | null
          created_at: string | null
          display_name: string
          id: string
          rank: number | null
          submitted_at: string | null
          total_marks: number | null
          user_id: string | null
        }
        Insert: {
          contest_id?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          rank?: number | null
          submitted_at?: string | null
          total_marks?: number | null
          user_id?: string | null
        }
        Update: {
          contest_id?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          rank?: number | null
          submitted_at?: string | null
          total_marks?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_questions: {
        Row: {
          contest_id: string | null
          id: string
          marks: number | null
          question_id: string | null
        }
        Insert: {
          contest_id?: string | null
          id?: string
          marks?: number | null
          question_id?: string | null
        }
        Update: {
          contest_id?: string | null
          id?: string
          marks?: number | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_questions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["contest_id"]
          },
        ]
      }
      contest_testers: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      contests: {
        Row: {
          contest_id: string
          created_at: string | null
          end_time: string
          result_time: string
          start_time: string
          title: string
        }
        Insert: {
          contest_id?: string
          created_at?: string | null
          end_time: string
          result_time: string
          start_time: string
          title: string
        }
        Update: {
          contest_id?: string
          created_at?: string | null
          end_time?: string
          result_time?: string
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      mock_test_results: {
        Row: {
          chemistry_correct: number
          chemistry_score: number
          chemistry_unattempted: number
          chemistry_wrong: number
          created_at: string
          id: number
          maths_correct: number
          maths_score: number
          maths_unattempted: number
          maths_wrong: number
          percentile: number | null
          physics_correct: number
          physics_score: number
          physics_unattempted: number
          physics_wrong: number
          rank: number | null
          submitted_at: string
          test_id: string
          time_spent_seconds: number
          total_correct: number
          total_questions_attempted: number
          total_score: number
          total_unattempted: number
          total_wrong: number
          user_id: string
        }
        Insert: {
          chemistry_correct?: number
          chemistry_score?: number
          chemistry_unattempted?: number
          chemistry_wrong?: number
          created_at?: string
          id?: number
          maths_correct?: number
          maths_score?: number
          maths_unattempted?: number
          maths_wrong?: number
          percentile?: number | null
          physics_correct?: number
          physics_score?: number
          physics_unattempted?: number
          physics_wrong?: number
          rank?: number | null
          submitted_at?: string
          test_id?: string
          time_spent_seconds?: number
          total_correct?: number
          total_questions_attempted?: number
          total_score?: number
          total_unattempted?: number
          total_wrong?: number
          user_id: string
        }
        Update: {
          chemistry_correct?: number
          chemistry_score?: number
          chemistry_unattempted?: number
          chemistry_wrong?: number
          created_at?: string
          id?: number
          maths_correct?: number
          maths_score?: number
          maths_unattempted?: number
          maths_wrong?: number
          percentile?: number | null
          physics_correct?: number
          physics_score?: number
          physics_unattempted?: number
          physics_wrong?: number
          rank?: number | null
          submitted_at?: string
          test_id?: string
          time_spent_seconds?: number
          total_correct?: number
          total_questions_attempted?: number
          total_score?: number
          total_unattempted?: number
          total_wrong?: number
          user_id?: string
        }
        Relationships: []
      }
      otp_store: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          mode: string
          otp: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          mode: string
          otp: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          mode?: string
          otp?: string
          used?: boolean
        }
        Relationships: []
      }
      password_reset_otps: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          purpose: string | null
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          purpose?: string | null
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          purpose?: string | null
          used?: boolean | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          chapter: string | null
          chapter_id: string | null
          correct_answer: string | null
          exam_shift: string | null
          exam_year: number | null
          id: number
          options_list: string | null
          question_image_url: string | null
          question_text: string
          solution: string | null
          subject: string | null
        }
        Insert: {
          chapter?: string | null
          chapter_id?: string | null
          correct_answer?: string | null
          exam_shift?: string | null
          exam_year?: number | null
          id: number
          options_list?: string | null
          question_image_url?: string | null
          question_text: string
          solution?: string | null
          subject?: string | null
        }
        Update: {
          chapter?: string | null
          chapter_id?: string | null
          correct_answer?: string | null
          exam_shift?: string | null
          exam_year?: number | null
          id?: number
          options_list?: string | null
          question_image_url?: string | null
          question_text?: string
          solution?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      social_notifications: {
        Row: {
          comment_id: string | null
          created_at: string | null
          from_user_id: string | null
          id: string
          is_read: boolean | null
          message: string
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          id: number
          question_id: number | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          id?: number
          question_id?: number | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          id?: number
          question_id?: number | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          email: string
          id: string
          paid_on: string
          payment_id: string | null
          plan_name: string
          user_id: string
          valid_until: string
        }
        Insert: {
          email: string
          id?: string
          paid_on?: string
          payment_id?: string | null
          plan_name: string
          user_id: string
          valid_until: string
        }
        Update: {
          email?: string
          id?: string
          paid_on?: string
          payment_id?: string | null
          plan_name?: string
          user_id?: string
          valid_until?: string
        }
        Relationships: []
      }
      team_challenge_results: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          id: string
          score: number | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          id?: string
          score?: number | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          id?: string
          score?: number | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_challenge_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "team_challenges"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "team_challenge_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_challenge_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_challenges: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          challenge_id: string
          challenge_type: string | null
          challenger_participants: number | null
          challenger_score: number | null
          challenger_team: string | null
          end_time: string | null
          mock_test_id: string | null
          opponent_participants: number | null
          opponent_score: number | null
          opponent_team: string | null
          start_time: string | null
          status: string | null
          winner_team: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          challenge_id?: string
          challenge_type?: string | null
          challenger_participants?: number | null
          challenger_score?: number | null
          challenger_team?: string | null
          end_time?: string | null
          mock_test_id?: string | null
          opponent_participants?: number | null
          opponent_score?: number | null
          opponent_team?: string | null
          start_time?: string | null
          status?: string | null
          winner_team?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          challenge_id?: string
          challenge_type?: string | null
          challenger_participants?: number | null
          challenger_score?: number | null
          challenger_team?: string | null
          end_time?: string | null
          mock_test_id?: string | null
          opponent_participants?: number | null
          opponent_score?: number | null
          opponent_team?: string | null
          start_time?: string | null
          status?: string | null
          winner_team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_challenges_challenger_team_fkey"
            columns: ["challenger_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_challenges_opponent_team_fkey"
            columns: ["opponent_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_challenges_winner_team_fkey"
            columns: ["winner_team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_leaderboard: {
        Row: {
          id: string
          period: string | null
          rank: number | null
          team_id: string | null
          total_questions: number | null
        }
        Insert: {
          id?: string
          period?: string | null
          rank?: number | null
          team_id?: string | null
          total_questions?: number | null
        }
        Update: {
          id?: string
          period?: string | null
          rank?: number | null
          team_id?: string | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_leaderboard_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_members: {
        Row: {
          daily_questions_solved: number | null
          id: string
          joined_at: string | null
          role: string | null
          team_id: string | null
          total_questions_solved: number | null
          user_id: string | null
        }
        Insert: {
          daily_questions_solved?: number | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string | null
          total_questions_solved?: number | null
          user_id?: string | null
        }
        Update: {
          daily_questions_solved?: number | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string | null
          total_questions_solved?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_notifications: {
        Row: {
          challenge_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          team_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          team_id?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          team_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_notifications_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "team_challenges"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "team_notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          short_id: string | null
          team_id: string
          team_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          short_id?: string | null
          team_id?: string
          team_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          short_id?: string | null
          team_id?: string
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_date: string
          chapter: string
          id: number
          questions_solved: number | null
          subject: string
          user_id: string
        }
        Insert: {
          activity_date: string
          chapter: string
          id?: number
          questions_solved?: number | null
          subject: string
          user_id: string
        }
        Update: {
          activity_date?: string
          chapter?: string
          id?: number
          questions_solved?: number | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          device_id: string
          id: string
          last_active: string | null
          user_id: string
        }
        Insert: {
          device_id: string
          id?: string
          last_active?: string | null
          user_id: string
        }
        Update: {
          device_id?: string
          id?: string
          last_active?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          combat_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_login: string | null
          phone: string | null
          serial_id: number
        }
        Insert: {
          avatar_url?: string | null
          combat_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          phone?: string | null
          serial_id?: number
        }
        Update: {
          avatar_url?: string | null
          combat_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          phone?: string | null
          serial_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_submissions_grouped: {
        Args: { p_start_date: string }
        Returns: {
          count: number
          submitted_date: string
        }[]
      }
      update_contest_ranks: {
        Args: { p_contest_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
