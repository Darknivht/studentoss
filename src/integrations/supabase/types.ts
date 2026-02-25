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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      blocked_app_list: {
        Row: {
          app_icon: string | null
          app_name: string
          created_at: string
          id: string
          is_active: boolean
          package_name: string
          user_id: string
        }
        Insert: {
          app_icon?: string | null
          app_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          package_name: string
          user_id: string
        }
        Update: {
          app_icon?: string | null
          app_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          package_name?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_claims: {
        Row: {
          challenge_id: string
          claimed_date: string
          created_at: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          challenge_id: string
          claimed_date?: string
          created_at?: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          challenge_id?: string
          claimed_date?: string
          created_at?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          course_id: string | null
          created_at: string | null
          id: string
          note_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          note_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          note_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          created_at: string
          exam_type_id: string
          id: string
          is_correct: boolean
          question_id: string | null
          selected_index: number
          session_id: string
          subject_id: string
          time_spent_seconds: number | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_type_id: string
          id?: string
          is_correct: boolean
          question_id?: string | null
          selected_index: number
          session_id?: string
          subject_id: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          exam_type_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          selected_index?: number
          session_id?: string
          subject_id?: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "exam_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_pdfs: {
        Row: {
          created_at: string | null
          exam_type_id: string
          file_url: string
          filename: string
          id: string
          questions_generated: number | null
          status: string | null
          subject_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          exam_type_id: string
          file_url: string
          filename: string
          id?: string
          questions_generated?: number | null
          status?: string | null
          subject_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          exam_type_id?: string
          file_url?: string
          filename?: string
          id?: string
          questions_generated?: number | null
          status?: string | null
          subject_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_pdfs_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_pdfs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_index: number
          created_at: string
          difficulty: string
          exam_type_id: string
          explanation: string | null
          id: string
          is_active: boolean
          options: Json
          question: string
          source: string
          subject_id: string
          topic_id: string | null
          year: string | null
        }
        Insert: {
          correct_index?: number
          created_at?: string
          difficulty?: string
          exam_type_id: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question: string
          source?: string
          subject_id: string
          topic_id?: string | null
          year?: string | null
        }
        Update: {
          correct_index?: number
          created_at?: string
          difficulty?: string
          exam_type_id?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question?: string
          source?: string
          subject_id?: string
          topic_id?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "exam_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          created_at: string
          exam_type_id: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          topics_count: number
        }
        Insert: {
          created_at?: string
          exam_type_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          topics_count?: number
        }
        Update: {
          created_at?: string
          exam_type_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          topics_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subscriptions: {
        Row: {
          amount_paid: number | null
          created_at: string
          exam_type_id: string | null
          expires_at: string | null
          id: string
          payment_reference: string | null
          plan: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          exam_type_id?: string | null
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          plan?: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          exam_type_id?: string | null
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          plan?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subscriptions_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_topics: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_active: boolean
          name: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          name: string
          subject_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_types: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          exam_mode: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          questions_per_subject: number
          slug: string
          subjects_required: number
          time_limit_minutes: number
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          exam_mode?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          questions_per_subject?: number
          slug: string
          subjects_required?: number
          time_limit_minutes?: number
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          exam_mode?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          questions_per_subject?: number
          slug?: string
          subjects_required?: number
          time_limit_minutes?: number
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          course_id: string | null
          created_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          next_review: string
          note_id: string | null
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          course_id?: string | null
          created_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          next_review?: string
          note_id?: string | null
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          course_id?: string | null
          created_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          next_review?: string
          note_id?: string | null
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_duration_minutes: number | null
          blocked_apps: Json | null
          created_at: string
          end_time: string | null
          id: string
          start_time: string
          status: string
          target_duration_minutes: number
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          blocked_apps?: Json | null
          created_at?: string
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string
          target_duration_minutes?: number
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          blocked_apps?: Json | null
          created_at?: string
          end_time?: string | null
          id?: string
          start_time?: string
          status?: string
          target_duration_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_resources: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          resource_id: string
          resource_type: string
          shared_by: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          resource_id: string
          resource_type: string
          shared_by: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          resource_id?: string
          resource_type?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_resources_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          message_type: string | null
          recipient_id: string | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message_type?: string | null
          recipient_id?: string | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message_type?: string | null
          recipient_id?: string | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string | null
          file_url: string | null
          id: string
          original_filename: string | null
          source_type: string | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          original_filename?: string | null
          source_type?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          original_filename?: string | null
          source_type?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_challenges: {
        Row: {
          challenged_id: string
          challenged_score: number | null
          challenger_id: string
          challenger_score: number | null
          created_at: string
          expires_at: string
          id: string
          note_id: string | null
          quiz_data: Json
          status: string
          xp_reward: number
        }
        Insert: {
          challenged_id: string
          challenged_score?: number | null
          challenger_id: string
          challenger_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          note_id?: string | null
          quiz_data?: Json
          status?: string
          xp_reward?: number
        }
        Update: {
          challenged_id?: string
          challenged_score?: number | null
          challenger_id?: string
          challenger_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          note_id?: string | null
          quiz_data?: Json
          status?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "peer_challenges_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          course_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          session_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_calls_reset_at: string | null
          ai_calls_today: number | null
          avatar_url: string | null
          content_filter_enabled: boolean | null
          created_at: string | null
          current_streak: number | null
          daily_time_limit: number | null
          display_name: string | null
          flashcards_generated_today: number | null
          full_name: string | null
          grade_level: string | null
          id: string
          is_under_14: boolean | null
          job_searches_reset_month: string | null
          job_searches_this_month: number | null
          last_study_date: string | null
          longest_streak: number | null
          notes_today: number | null
          parent_email: string | null
          parental_pin: string | null
          quizzes_today: number | null
          safe_search_enabled: boolean | null
          school_name: string | null
          study_persona: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          ai_calls_reset_at?: string | null
          ai_calls_today?: number | null
          avatar_url?: string | null
          content_filter_enabled?: boolean | null
          created_at?: string | null
          current_streak?: number | null
          daily_time_limit?: number | null
          display_name?: string | null
          flashcards_generated_today?: number | null
          full_name?: string | null
          grade_level?: string | null
          id?: string
          is_under_14?: boolean | null
          job_searches_reset_month?: string | null
          job_searches_this_month?: number | null
          last_study_date?: string | null
          longest_streak?: number | null
          notes_today?: number | null
          parent_email?: string | null
          parental_pin?: string | null
          quizzes_today?: number | null
          safe_search_enabled?: boolean | null
          school_name?: string | null
          study_persona?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          ai_calls_reset_at?: string | null
          ai_calls_today?: number | null
          avatar_url?: string | null
          content_filter_enabled?: boolean | null
          created_at?: string | null
          current_streak?: number | null
          daily_time_limit?: number | null
          display_name?: string | null
          flashcards_generated_today?: number | null
          full_name?: string | null
          grade_level?: string | null
          id?: string
          is_under_14?: boolean | null
          job_searches_reset_month?: string | null
          job_searches_this_month?: number | null
          last_study_date?: string | null
          longest_streak?: number | null
          notes_today?: number | null
          parent_email?: string | null
          parental_pin?: string | null
          quizzes_today?: number | null
          safe_search_enabled?: boolean | null
          school_name?: string | null
          study_persona?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          course_id: string | null
          id: string
          note_id: string | null
          quiz_data: Json
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id?: string | null
          id?: string
          note_id?: string | null
          quiz_data: Json
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string | null
          id?: string
          note_id?: string | null
          quiz_data?: Json
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      store_resources: {
        Row: {
          author: string | null
          category: string
          created_at: string
          description: string | null
          download_count: number
          file_url: string | null
          grade_level: string
          id: string
          is_free: boolean
          required_tier: string
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          author?: string | null
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_url?: string | null
          grade_level: string
          id?: string
          is_free?: boolean
          required_tier?: string
          subject: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_url?: string | null
          grade_level?: string
          id?: string
          is_free?: boolean
          required_tier?: string
          subject?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          completed: boolean
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string
          goal_type: string
          id: string
          priority: string
          reminder_enabled: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          goal_type?: string
          id?: string
          priority?: string
          reminder_enabled?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          goal_type?: string
          id?: string
          priority?: string
          reminder_enabled?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_goals_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          invitation_code: string
          is_public: boolean | null
          max_members: number | null
          name: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          invitation_code: string
          is_public?: boolean | null
          max_members?: number | null
          name: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          invitation_code?: string
          is_public?: boolean | null
          max_members?: number | null
          name?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          activities_count: number | null
          created_at: string | null
          id: string
          session_date: string
          total_minutes: number | null
          updated_at: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          activities_count?: number | null
          created_at?: string | null
          id?: string
          session_date?: string
          total_minutes?: number | null
          updated_at?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          activities_count?: number | null
          created_at?: string | null
          id?: string
          session_date?: string
          total_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_xp: {
        Row: {
          created_at: string
          flashcards_reviewed: number
          focus_minutes: number
          id: string
          notes_created: number
          quizzes_completed: number
          updated_at: string
          user_id: string
          week_start: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          flashcards_reviewed?: number
          focus_minutes?: number
          id?: string
          notes_created?: number
          quizzes_completed?: number
          updated_at?: string
          user_id: string
          week_start: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          flashcards_reviewed?: number
          focus_minutes?: number
          id?: string
          notes_created?: number
          quizzes_completed?: number
          updated_at?: string
          user_id?: string
          week_start?: string
          xp_earned?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: { Args: never; Returns: string }
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
