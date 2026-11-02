// ============================================================================
// Sahil's Shore: Supabase Database TypeScript Definitions
// Auto-aligned with Supabase Schema (37 tables + functions)
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          theme: Json;
          layout: Json;
          modules_config: Json;
          privacy: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: Json;
          layout?: Json;
          modules_config?: Json;
          privacy?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: Json;
          layout?: Json;
          modules_config?: Json;
          privacy?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      timeline_events: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          occurred_at: string;
          ref_table: string | null;
          ref_id: string | null;
          summary: string;
          meta: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          occurred_at?: string;
          ref_table?: string | null;
          ref_id?: string | null;
          summary: string;
          meta?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          occurred_at?: string;
          ref_table?: string | null;
          ref_id?: string | null;
          summary?: string;
          meta?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          status: "todo" | "in_progress" | "completed" | "cancelled";
          due_date: string | null;
          due_time: string | null;
          tags: string[];
          is_recurring: boolean;
          recurrence_rule: Json | null;
          completed_at: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          priority?: ("low" | "medium" | "high" | "urgent");
          status?: ("todo" | "in_progress" | "completed" | "cancelled");
          due_date?: string | null;
          due_time?: string | null;
          tags?: string[];
          is_recurring?: boolean;
          recurrence_rule?: Json | null;
          completed_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          priority?: ("low" | "medium" | "high" | "urgent");
          status?: ("todo" | "in_progress" | "completed" | "cancelled");
          due_date?: string | null;
          due_time?: string | null;
          tags?: string[];
          is_recurring?: boolean;
          recurrence_rule?: Json | null;
          completed_at?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subtasks: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          title: string;
          is_completed: boolean;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          title: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          title?: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          frequency: "daily" | "weekly" | "custom";
          target_days: string[];
          color: string | null;
          icon: string | null;
          current_streak: number;
          best_streak: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          frequency?: ("daily" | "weekly" | "custom");
          target_days?: string[];
          color?: string | null;
          icon?: string | null;
          current_streak?: number;
          best_streak?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          frequency?: ("daily" | "weekly" | "custom");
          target_days?: string[];
          color?: string | null;
          icon?: string | null;
          current_streak?: number;
          best_streak?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      habit_logs: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          logged_date: string;
          completed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          logged_date: string;
          completed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          logged_date?: string;
          completed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          daily_target_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          daily_target_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          daily_target_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          started_at: string;
          duration_seconds: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: string;
          started_at?: string;
          duration_seconds?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string;
          started_at?: string;
          duration_seconds?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      dsa_problems: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          link: string | null;
          platform: string | null;
          topic: string | null;
          difficulty: "Easy" | "Medium" | "Hard";
          status: "todo" | "attempted" | "solved" | "mastered";
          time_spent_minutes: number | null;
          approach_notes: string | null;
          code_snippet: string | null;
          language: string;
          next_revision_at: string | null;
          revision_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          link?: string | null;
          platform?: string | null;
          topic?: string | null;
          difficulty?: ("Easy" | "Medium" | "Hard");
          status?: ("todo" | "attempted" | "solved" | "mastered");
          time_spent_minutes?: number | null;
          approach_notes?: string | null;
          code_snippet?: string | null;
          language?: string;
          next_revision_at?: string | null;
          revision_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          link?: string | null;
          platform?: string | null;
          topic?: string | null;
          difficulty?: ("Easy" | "Medium" | "Hard");
          status?: ("todo" | "attempted" | "solved" | "mastered");
          time_spent_minutes?: number | null;
          approach_notes?: string | null;
          code_snippet?: string | null;
          language?: string;
          next_revision_at?: string | null;
          revision_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_tracks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_items: {
        Row: {
          id: string;
          user_id: string;
          track_id: string | null;
          topic: string;
          status: "planned" | "in_progress" | "completed";
          notes: string | null;
          resources: Json;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id?: string | null;
          topic: string;
          status?: ("planned" | "in_progress" | "completed");
          notes?: string | null;
          resources?: Json;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string | null;
          topic?: string;
          status?: ("planned" | "in_progress" | "completed");
          notes?: string | null;
          resources?: Json;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          track_id: string | null;
          title: string;
          description: string | null;
          tech_stack: string[];
          status: "idea" | "in_progress" | "completed" | "deployed";
          repo_url: string | null;
          deployed_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id?: string | null;
          title: string;
          description?: string | null;
          tech_stack?: string[];
          status?: ("idea" | "in_progress" | "completed" | "deployed");
          repo_url?: string | null;
          deployed_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string | null;
          title?: string;
          description?: string | null;
          tech_stack?: string[];
          status?: ("idea" | "in_progress" | "completed" | "deployed");
          repo_url?: string | null;
          deployed_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interview_qa: {
        Row: {
          id: string;
          user_id: string;
          track_id: string | null;
          technology: string;
          question: string;
          answer: string;
          difficulty: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id?: string | null;
          technology: string;
          question: string;
          answer: string;
          difficulty?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string | null;
          technology?: string;
          question?: string;
          answer?: string;
          difficulty?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vocab_cards: {
        Row: {
          id: string;
          user_id: string;
          german_text: string;
          english_meaning: string;
          part_of_speech: string | null;
          gender: "der" | "die" | "das" | null;
          plural: string | null;
          example_sentence: string | null;
          cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
          repetition: number;
          interval: number;
          ease_factor: number;
          next_review_at: string;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          german_text: string;
          english_meaning: string;
          part_of_speech?: string | null;
          gender?: ("der" | "die" | "das" | null);
          plural?: string | null;
          example_sentence?: string | null;
          cefr_level?: ("A1" | "A2" | "B1" | "B2" | "C1" | "C2");
          repetition?: number;
          interval?: number;
          ease_factor?: number;
          next_review_at?: string;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          german_text?: string;
          english_meaning?: string;
          part_of_speech?: string | null;
          gender?: ("der" | "die" | "das" | null);
          plural?: string | null;
          example_sentence?: string | null;
          cefr_level?: ("A1" | "A2" | "B1" | "B2" | "C1" | "C2");
          repetition?: number;
          interval?: number;
          ease_factor?: number;
          next_review_at?: string;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grammar_notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          cefr_level: string;
          content: string;
          rules: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          cefr_level?: string;
          content: string;
          rules?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          cefr_level?: string;
          content?: string;
          rules?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pronunciation_recordings: {
        Row: {
          id: string;
          user_id: string;
          phrase: string;
          audio_url: string;
          reference_audio_url: string | null;
          score: number | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phrase: string;
          audio_url: string;
          reference_audio_url?: string | null;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          phrase?: string;
          audio_url?: string;
          reference_audio_url?: string | null;
          score?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          version_label: string;
          target_role: string | null;
          file_url: string | null;
          drive_file_id: string | null;
          content: Json;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          version_label: string;
          target_role?: string | null;
          file_url?: string | null;
          drive_file_id?: string | null;
          content?: Json;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          version_label?: string;
          target_role?: string | null;
          file_url?: string | null;
          drive_file_id?: string | null;
          content?: Json;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bullet_bank: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          category: string | null;
          skills: string[];
          metrics: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          category?: string | null;
          skills?: string[];
          metrics?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          category?: string | null;
          skills?: string[];
          metrics?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          role: string;
          location: string | null;
          stage: "wishlist" | "applied" | "interview" | "offer" | "rejected";
          applied_at: string | null;
          salary_range: string | null;
          job_url: string | null;
          notes: string | null;
          next_follow_up: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          role: string;
          location?: string | null;
          stage?: ("wishlist" | "applied" | "interview" | "offer" | "rejected");
          applied_at?: string | null;
          salary_range?: string | null;
          job_url?: string | null;
          notes?: string | null;
          next_follow_up?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          role?: string;
          location?: string | null;
          stage?: ("wishlist" | "applied" | "interview" | "offer" | "rejected");
          applied_at?: string | null;
          salary_range?: string | null;
          job_url?: string | null;
          notes?: string | null;
          next_follow_up?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interview_stories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          situation: string;
          task: string;
          action: string;
          result: string;
          skills: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          situation: string;
          task: string;
          action: string;
          result: string;
          skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          situation?: string;
          task?: string;
          action?: string;
          result?: string;
          skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount_paise: number;
          spent_at: string;
          payment_method: string;
          place: string | null;
          notes: string | null;
          receipt_url: string | null;
          drive_file_id: string | null;
          is_recurring: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount_paise: number;
          spent_at?: string;
          payment_method?: string;
          place?: string | null;
          notes?: string | null;
          receipt_url?: string | null;
          drive_file_id?: string | null;
          is_recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount_paise?: number;
          spent_at?: string;
          payment_method?: string;
          place?: string | null;
          notes?: string | null;
          receipt_url?: string | null;
          drive_file_id?: string | null;
          is_recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          amount_paise: number;
          received_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          amount_paise: number;
          received_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          amount_paise?: number;
          received_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          month_year: string;
          amount_paise: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          month_year: string;
          amount_paise: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          month_year?: string;
          amount_paise?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          description: string;
          location_type: "home" | "restaurant" | "office" | "other";
          restaurant_name: string | null;
          expense_id: string | null;
          rating: number | null;
          photo_url: string | null;
          notes_taste: string | null;
          notes_health: string | null;
          eaten_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          description: string;
          location_type?: ("home" | "restaurant" | "office" | "other");
          restaurant_name?: string | null;
          expense_id?: string | null;
          rating?: number | null;
          photo_url?: string | null;
          notes_taste?: string | null;
          notes_health?: string | null;
          eaten_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
          description?: string;
          location_type?: ("home" | "restaurant" | "office" | "other");
          restaurant_name?: string | null;
          expense_id?: string | null;
          rating?: number | null;
          photo_url?: string | null;
          notes_taste?: string | null;
          notes_health?: string | null;
          eaten_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          visited_at: string;
          lat: number | null;
          lng: number | null;
          rating: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string;
          visited_at?: string;
          lat?: number | null;
          lng?: number | null;
          rating?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          visited_at?: string;
          lat?: number | null;
          lng?: number | null;
          rating?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_items: {
        Row: {
          id: string;
          user_id: string;
          drive_file_id: string | null;
          file_name: string;
          mime_type: string;
          media_type: "photo" | "video" | "receipt" | "audio";
          thumb_path: string | null;
          taken_at: string;
          lat: number | null;
          lng: number | null;
          links: Json;
          album_id: string | null;
          sync_status: "pending" | "synced" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          drive_file_id?: string | null;
          file_name: string;
          mime_type: string;
          media_type?: ("photo" | "video" | "receipt" | "audio");
          thumb_path?: string | null;
          taken_at?: string;
          lat?: number | null;
          lng?: number | null;
          links?: Json;
          album_id?: string | null;
          sync_status?: ("pending" | "synced" | "failed");
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          drive_file_id?: string | null;
          file_name?: string;
          mime_type?: string;
          media_type?: ("photo" | "video" | "receipt" | "audio");
          thumb_path?: string | null;
          taken_at?: string;
          lat?: number | null;
          lng?: number | null;
          links?: Json;
          album_id?: string | null;
          sync_status?: ("pending" | "synced" | "failed");
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          mood: number | null;
          energy: number | null;
          gratitude: string[];
          wins: string[];
          lessons: string[];
          content: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          mood?: number | null;
          energy?: number | null;
          gratitude?: string[];
          wins?: string[];
          lessons?: string[];
          content?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          mood?: number | null;
          energy?: number | null;
          gratitude?: string[];
          wins?: string[];
          lessons?: string[];
          content?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          tags: string[];
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          tags?: string[];
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      note_links: {
        Row: {
          id: string;
          user_id: string;
          source_note_id: string;
          target_note_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_note_id: string;
          target_note_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_note_id?: string;
          target_note_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string | null;
          target_date: string | null;
          status: "in_progress" | "completed" | "archived";
          progress_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string | null;
          target_date?: string | null;
          status?: ("in_progress" | "completed" | "archived");
          progress_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string | null;
          target_date?: string | null;
          status?: ("in_progress" | "completed" | "archived");
          progress_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          title: string;
          due_date: string | null;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          title: string;
          due_date?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_id?: string;
          title?: string;
          due_date?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      health_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          water_ml: number | null;
          sleep_hours: number | null;
          workout_minutes: number | null;
          workout_notes: string | null;
          weight_kg: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          water_ml?: number | null;
          sleep_hours?: number | null;
          workout_minutes?: number | null;
          workout_notes?: string | null;
          weight_kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          water_ml?: number | null;
          sleep_hours?: number | null;
          workout_minutes?: number | null;
          workout_notes?: string | null;
          weight_kg?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      drive_credentials: {
        Row: {
          id: string;
          user_id: string;
          encrypted_refresh_token: string;
          folder_id: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          encrypted_refresh_token: string;
          folder_id?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_refresh_token?: string;
          folder_id?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sync_queue: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          payload: Json;
          status: "pending" | "processing" | "completed" | "failed";
          attempts: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          payload?: Json;
          status?: ("pending" | "processing" | "completed" | "failed");
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          payload?: Json;
          status?: ("pending" | "processing" | "completed" | "failed");
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      seed_user_defaults: {
        Args: { p_user_id: string };
        Returns: void;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
  };
}
