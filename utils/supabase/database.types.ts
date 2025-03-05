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
      custom_job_credits: {
        Row: {
          created_at: string
          id: string
          number_of_credits: number
        }
        Insert: {
          created_at?: string
          id: string
          number_of_credits: number
        }
        Update: {
          created_at?: string
          id?: string
          number_of_credits?: number
        }
        Relationships: []
      }
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
      custom_job_mock_interview_feedback: {
        Row: {
          cons: string[]
          created_at: string
          id: string
          input_token_count: number
          job_fit_analysis: string
          job_fit_percentage: number
          key_improvements: string[]
          mock_interview_id: string | null
          output_token_count: number
          overview: string
          pros: string[]
          score: number
        }
        Insert: {
          cons: string[]
          created_at?: string
          id?: string
          input_token_count: number
          job_fit_analysis: string
          job_fit_percentage: number
          key_improvements: string[]
          mock_interview_id?: string | null
          output_token_count: number
          overview: string
          pros: string[]
          score: number
        }
        Update: {
          cons?: string[]
          created_at?: string
          id?: string
          input_token_count?: number
          job_fit_analysis?: string
          job_fit_percentage?: number
          key_improvements?: string[]
          mock_interview_id?: string | null
          output_token_count?: number
          overview?: string
          pros?: string[]
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_mock_interview_feedback_mock_interview_id_fkey"
            columns: ["mock_interview_id"]
            isOneToOne: false
            referencedRelation: "custom_job_mock_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_mock_interviews: {
        Row: {
          created_at: string
          custom_job_id: string
          id: string
          interview_prompt: string
          recording_file_path: string | null
          status: Database["public"]["Enums"]["interview_status"]
        }
        Insert: {
          created_at?: string
          custom_job_id: string
          id?: string
          interview_prompt: string
          recording_file_path?: string | null
          status: Database["public"]["Enums"]["interview_status"]
        }
        Update: {
          created_at?: string
          custom_job_id?: string
          id?: string
          interview_prompt?: string
          recording_file_path?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
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
          status: Database["public"]["Enums"]["custom_job_access"]
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description: string
          job_title: string
          status: Database["public"]["Enums"]["custom_job_access"]
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
          status?: Database["public"]["Enums"]["custom_job_access"]
          user_id?: string
        }
        Relationships: []
      }
      demo_job_questions: {
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
            foreignKeyName: "demo_custom_job_questions_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "demo_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_jobs: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string
          id: string
          job_description: string
          job_title: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description: string
          job_title: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
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
      interview_copilot_files: {
        Row: {
          created_at: string
          file_path: string
          google_file_name: string
          google_file_uri: string
          id: string
          interview_copilot_id: string
          mime_type: string
        }
        Insert: {
          created_at?: string
          file_path: string
          google_file_name: string
          google_file_uri: string
          id?: string
          interview_copilot_id: string
          mime_type: string
        }
        Update: {
          created_at?: string
          file_path?: string
          google_file_name?: string
          google_file_uri?: string
          id?: string
          interview_copilot_id?: string
          mime_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_copilot_files_interview_copilot_id_fkey"
            columns: ["interview_copilot_id"]
            isOneToOne: false
            referencedRelation: "interview_copilots"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_copilot_questions_and_answers: {
        Row: {
          answer: string
          created_at: string
          id: string
          interview_copilot_id: string
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          interview_copilot_id: string
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          interview_copilot_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_copilot_questions_and_answe_interview_copilot_id_fkey"
            columns: ["interview_copilot_id"]
            isOneToOne: false
            referencedRelation: "interview_copilots"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_copilots: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string
          deletion_status: Database["public"]["Enums"]["deletion_status"]
          duration_ms: number
          file_path: string | null
          id: string
          input_tokens_count: number
          interview_copilot_access: Database["public"]["Enums"]["interview_copilot_access"]
          job_description: string | null
          job_title: string | null
          output_tokens_count: number
          status: Database["public"]["Enums"]["interview_status"]
          title: string
          transcript: string
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          deletion_status: Database["public"]["Enums"]["deletion_status"]
          duration_ms: number
          file_path?: string | null
          id?: string
          input_tokens_count: number
          interview_copilot_access: Database["public"]["Enums"]["interview_copilot_access"]
          job_description?: string | null
          job_title?: string | null
          output_tokens_count: number
          status: Database["public"]["Enums"]["interview_status"]
          title: string
          transcript: string
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          deletion_status?: Database["public"]["Enums"]["deletion_status"]
          duration_ms?: number
          file_path?: string | null
          id?: string
          input_tokens_count?: number
          interview_copilot_access?: Database["public"]["Enums"]["interview_copilot_access"]
          job_description?: string | null
          job_title?: string | null
          output_tokens_count?: number
          status?: Database["public"]["Enums"]["interview_status"]
          title?: string
          transcript?: string
          user_id?: string
        }
        Relationships: []
      }
      mock_interview_messages: {
        Row: {
          created_at: string
          id: string
          mock_interview_id: string
          role: Database["public"]["Enums"]["message_role"]
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          mock_interview_id: string
          role: Database["public"]["Enums"]["message_role"]
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          mock_interview_id?: string
          role?: Database["public"]["Enums"]["message_role"]
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_messages_mock_interview_id_fkey"
            columns: ["mock_interview_id"]
            isOneToOne: false
            referencedRelation: "custom_job_mock_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_question_feedback: {
        Row: {
          answer: string
          cons: string[]
          created_at: string
          id: string
          mock_interview_id: string
          pros: string[]
          question: string
          score: number
        }
        Insert: {
          answer: string
          cons: string[]
          created_at?: string
          id?: string
          mock_interview_id: string
          pros: string[]
          question: string
          score: number
        }
        Update: {
          answer?: string
          cons?: string[]
          created_at?: string
          id?: string
          mock_interview_id?: string
          pros?: string[]
          question?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_question_feedback_mock_interview_id_fkey"
            columns: ["mock_interview_id"]
            isOneToOne: false
            referencedRelation: "custom_job_mock_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_detail_items: {
        Row: {
          created_at: string | null
          date_range: string | null
          display_order: number
          id: string
          section_id: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_range?: string | null
          display_order: number
          id?: string
          section_id: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_range?: string | null
          display_order?: number
          id?: string
          section_id?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_detail_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_item_descriptions: {
        Row: {
          created_at: string | null
          description: string
          detail_item_id: string
          display_order: number
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          detail_item_id: string
          display_order: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          detail_item_id?: string
          display_order?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_item_descriptions_detail_item_id_fkey"
            columns: ["detail_item_id"]
            isOneToOne: false
            referencedRelation: "resume_detail_items"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_list_items: {
        Row: {
          content: string
          created_at: string | null
          display_order: number
          id: string
          section_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order: number
          id?: string
          section_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number
          id?: string
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_list_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_sections: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          resume_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          resume_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          resume_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_sections_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          location: string | null
          locked_status: Database["public"]["Enums"]["locked_status"]
          name: string
          phone: string | null
          summary: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          locked_status: Database["public"]["Enums"]["locked_status"]
          name: string
          phone?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          locked_status?: Database["public"]["Enums"]["locked_status"]
          name?: string
          phone?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
        }
        Insert: {
          created_at?: string
          id: string
          stripe_customer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
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
      custom_job_access: "locked" | "unlocked"
      deletion_status: "deleted" | "not_deleted"
      interview_copilot_access: "locked" | "unlocked"
      interview_copilot_status: "in_progress" | "complete"
      interview_status: "in_progress" | "complete"
      locked_status: "locked" | "unlocked"
      message_role: "user" | "model"
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
