export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_job_files: {
        Row: {
          created_at: string
          custom_job_id: string
          display_name: string
          file_path: string
          google_file_name: string
          google_file_uri: string
          id: string
          mime_type: string
        }
        Insert: {
          created_at?: string
          custom_job_id: string
          display_name: string
          file_path: string
          google_file_name: string
          google_file_uri: string
          id?: string
          mime_type: string
        }
        Update: {
          created_at?: string
          custom_job_id?: string
          display_name?: string
          file_path?: string
          google_file_name?: string
          google_file_uri?: string
          id?: string
          mime_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_files_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_mock_interviews: {
        Row: {
          created_at: string
          custom_job_id: string
          feedback: Json | null
          id: string
          recording_file_path: string
          transcript: string
        }
        Insert: {
          created_at?: string
          custom_job_id: string
          feedback?: Json | null
          id?: string
          recording_file_path: string
          transcript: string
        }
        Update: {
          created_at?: string
          custom_job_id?: string
          feedback?: Json | null
          id?: string
          recording_file_path?: string
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_mock_interviews_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_question_submissions: {
        Row: {
          answer: string
          created_at: string
          custom_job_question_id: string
          feedback: Json | null
          id: string
        }
        Insert: {
          answer: string
          created_at?: string
          custom_job_question_id: string
          feedback?: Json | null
          id?: string
        }
        Update: {
          answer?: string
          created_at?: string
          custom_job_question_id?: string
          feedback?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_question_submissions_custom_job_question_id_fkey"
            columns: ["custom_job_question_id"]
            isOneToOne: false
            referencedRelation: "custom_job_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_questions: {
        Row: {
          answer_guidelines: string
          created_at: string
          custom_job_id: string
          id: string
          question: string
        }
        Insert: {
          answer_guidelines: string
          created_at?: string
          custom_job_id: string
          id?: string
          question: string
        }
        Update: {
          answer_guidelines?: string
          created_at?: string
          custom_job_id?: string
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_questions_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_jobs: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string
          id: string
          job_description: string
          job_title: string
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description: string
          job_title: string
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
          user_id?: string
        }
        Relationships: []
      }
      email_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
