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
          variables?: Json
          query?: string
          extensions?: Json
          operationName?: string
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
      coach_branding: {
        Row: {
          coach_id: string
          created_at: string
          primary_color_hex: string
          title: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          primary_color_hex: string
          title: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          primary_color_hex?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_branding_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_job_categories: {
        Row: {
          category: string
          created_at: string
          custom_job_id: string
          id: string
          job_title: string
        }
        Insert: {
          category: string
          created_at?: string
          custom_job_id: string
          id?: string
          job_title: string
        }
        Update: {
          category?: string
          created_at?: string
          custom_job_id?: string
          id?: string
          job_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_categories_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      custom_job_question_sample_answers: {
        Row: {
          answer: string
          bucket: string | null
          created_at: string
          file_path: string | null
          id: string
          question_id: string
        }
        Insert: {
          answer: string
          bucket?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          question_id: string
        }
        Update: {
          answer?: string
          bucket?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_question_sample_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "custom_job_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_question_submission_feedback: {
        Row: {
          cons: string[]
          correctness_score: number | null
          created_at: string
          feedback_role: Database["public"]["Enums"]["feedback_role"]
          id: string
          pros: string[]
          submission_id: string
        }
        Insert: {
          cons: string[]
          correctness_score?: number | null
          created_at?: string
          feedback_role: Database["public"]["Enums"]["feedback_role"]
          id?: string
          pros: string[]
          submission_id: string
        }
        Update: {
          cons?: string[]
          correctness_score?: number | null
          created_at?: string
          feedback_role?: Database["public"]["Enums"]["feedback_role"]
          id?: string
          pros?: string[]
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_question_submission_feedback_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "custom_job_question_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_question_submission_mux_metadata: {
        Row: {
          asset_id: string | null
          created_at: string
          duration: number | null
          id: string
          playback_id: string | null
          status: Database["public"]["Enums"]["mux_status"]
          upload_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          playback_id?: string | null
          status: Database["public"]["Enums"]["mux_status"]
          upload_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          playback_id?: string | null
          status?: Database["public"]["Enums"]["mux_status"]
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_question_submission_mux_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "custom_job_question_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_question_submissions: {
        Row: {
          answer: string
          audio_bucket: string | null
          audio_file_path: string | null
          audio_recording_duration: number | null
          created_at: string
          custom_job_question_id: string
          feedback: Json | null
          id: string
        }
        Insert: {
          answer: string
          audio_bucket?: string | null
          audio_file_path?: string | null
          audio_recording_duration?: number | null
          created_at?: string
          custom_job_question_id: string
          feedback?: Json | null
          id?: string
        }
        Update: {
          answer?: string
          audio_bucket?: string | null
          audio_file_path?: string | null
          audio_recording_duration?: number | null
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
          publication_status: Database["public"]["Enums"]["question_publication_status"]
          question: string
          question_type: Database["public"]["Enums"]["question_type"]
          source_custom_job_question_id: string | null
        }
        Insert: {
          answer_guidelines: string
          created_at?: string
          custom_job_id: string
          id?: string
          publication_status?: Database["public"]["Enums"]["question_publication_status"]
          question: string
          question_type?: Database["public"]["Enums"]["question_type"]
          source_custom_job_question_id?: string | null
        }
        Update: {
          answer_guidelines?: string
          created_at?: string
          custom_job_id?: string
          id?: string
          publication_status?: Database["public"]["Enums"]["question_publication_status"]
          question?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          source_custom_job_question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_questions_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_job_questions_source_custom_job_question_id_fkey"
            columns: ["source_custom_job_question_id"]
            isOneToOne: false
            referencedRelation: "custom_job_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_jobs: {
        Row: {
          coach_id: string | null
          company_description: string | null
          company_name: string | null
          created_at: string
          id: string
          job_description: string | null
          job_title: string
          source_custom_job_id: string | null
          status: Database["public"]["Enums"]["custom_job_access"]
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_title: string
          source_custom_job_id?: string | null
          status: Database["public"]["Enums"]["custom_job_access"]
          user_id: string
        }
        Update: {
          coach_id?: string | null
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_title?: string
          source_custom_job_id?: string | null
          status?: Database["public"]["Enums"]["custom_job_access"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_jobs_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_jobs_source_custom_job_id_fkey"
            columns: ["source_custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_job_questions: {
        Row: {
          answer_guidelines: string
          created_at: string
          custom_job_id: string
          good_answers: string[] | null
          id: string
          question: string
        }
        Insert: {
          answer_guidelines: string
          created_at?: string
          custom_job_id: string
          good_answers?: string[] | null
          id?: string
          question: string
        }
        Update: {
          answer_guidelines?: string
          created_at?: string
          custom_job_id?: string
          good_answers?: string[] | null
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
          slug: string | null
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description: string
          job_title: string
          slug?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
          slug?: string | null
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
      interview_copilot_demo_files: {
        Row: {
          created_at: string
          file_path: string
          google_file_mime_type: string
          google_file_name: string
          id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          google_file_mime_type: string
          google_file_name: string
          id?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          google_file_mime_type?: string
          google_file_name?: string
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
      mock_interview_message_mux_metadata: {
        Row: {
          asset_id: string | null
          created_at: string
          duration: number | null
          id: string
          playback_id: string | null
          status: Database["public"]["Enums"]["mux_status"]
          upload_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          duration?: number | null
          id: string
          playback_id?: string | null
          status: Database["public"]["Enums"]["mux_status"]
          upload_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          playback_id?: string | null
          status?: Database["public"]["Enums"]["mux_status"]
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_message_mux_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "mock_interview_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_messages: {
        Row: {
          bucket_name: string | null
          created_at: string
          id: string
          mock_interview_id: string
          recording_path: string | null
          role: Database["public"]["Enums"]["message_role"]
          text: string
        }
        Insert: {
          bucket_name?: string | null
          created_at?: string
          id?: string
          mock_interview_id: string
          recording_path?: string | null
          role: Database["public"]["Enums"]["message_role"]
          text: string
        }
        Update: {
          bucket_name?: string | null
          created_at?: string
          id?: string
          mock_interview_id?: string
          recording_path?: string | null
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
          mock_interview_question_id: string | null
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
          mock_interview_question_id?: string | null
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
          mock_interview_question_id?: string | null
          pros?: string[]
          question?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_question_feedbac_mock_interview_question_id_fkey"
            columns: ["mock_interview_question_id"]
            isOneToOne: false
            referencedRelation: "mock_interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_interview_question_feedback_mock_interview_id_fkey"
            columns: ["mock_interview_id"]
            isOneToOne: false
            referencedRelation: "custom_job_mock_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_questions: {
        Row: {
          created_at: string
          id: string
          interview_id: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_id: string
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_questions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "custom_job_mock_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_interview_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "custom_job_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          id: string
          user_id: string
        }
        Insert: {
          id?: string
          user_id: string
        }
        Update: {
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_redemptions: {
        Row: {
          created_at: string
          id: string
          referral_redemption_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          referral_redemption_count: number
        }
        Update: {
          created_at?: string
          id?: string
          referral_redemption_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code_id: string
        }
        Insert: {
          created_at?: string
          id: string
          referral_code_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
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
      resume_edits: {
        Row: {
          created_at: string
          id: string
          resume_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resume_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_edits_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
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
      resume_metadata: {
        Row: {
          company_description: string | null
          company_name: string | null
          created_at: string
          demo_job_id: string | null
          id: string
          important_skills: string[] | null
          important_work_experience: string[] | null
          job_description: string
          job_title: string
          resume_id: string
          slug: string | null
        }
        Insert: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          demo_job_id?: string | null
          id?: string
          important_skills?: string[] | null
          important_work_experience?: string[] | null
          job_description: string
          job_title: string
          resume_id: string
          slug?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string | null
          created_at?: string
          demo_job_id?: string | null
          id?: string
          important_skills?: string[] | null
          important_work_experience?: string[] | null
          job_description?: string
          job_title?: string
          resume_id?: string
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_metadata_demo_job_id_fkey"
            columns: ["demo_job_id"]
            isOneToOne: false
            referencedRelation: "demo_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_metadata_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
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
      user_coach_access: {
        Row: {
          coach_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coach_access_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_files: {
        Row: {
          added_to_memory: boolean
          bucket_name: string
          created_at: string
          display_name: string
          file_path: string
          google_file_name: string
          google_file_uri: string
          id: string
          mime_type: string
          user_id: string
        }
        Insert: {
          added_to_memory: boolean
          bucket_name: string
          created_at?: string
          display_name: string
          file_path: string
          google_file_name: string
          google_file_uri: string
          id?: string
          mime_type: string
          user_id: string
        }
        Update: {
          added_to_memory?: boolean
          bucket_name?: string
          created_at?: string
          display_name?: string
          file_path?: string
          google_file_name?: string
          google_file_uri?: string
          id?: string
          mime_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_knowledge_base: {
        Row: {
          created_at: string
          knowledge_base: string
          user_id: string
        }
        Insert: {
          created_at?: string
          knowledge_base: string
          user_id: string
        }
        Update: {
          created_at?: string
          knowledge_base?: string
          user_id?: string
        }
        Relationships: []
      }
      user_knowledge_base_conversations: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_knowledge_base_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          role?: Database["public"]["Enums"]["message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "user_info_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_knowledge_base_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      feedback_role: "ai" | "user"
      interview_copilot_access: "locked" | "unlocked"
      interview_copilot_status: "in_progress" | "complete"
      interview_status: "in_progress" | "complete"
      locked_status: "locked" | "unlocked"
      message_role: "user" | "model"
      mux_status: "preparing" | "ready" | "errored"
      question_publication_status: "draft" | "published"
      question_type: "ai_generated" | "user_generated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      custom_job_access: ["locked", "unlocked"],
      deletion_status: ["deleted", "not_deleted"],
      feedback_role: ["ai", "user"],
      interview_copilot_access: ["locked", "unlocked"],
      interview_copilot_status: ["in_progress", "complete"],
      interview_status: ["in_progress", "complete"],
      locked_status: ["locked", "unlocked"],
      message_role: ["user", "model"],
      mux_status: ["preparing", "ready", "errored"],
      question_publication_status: ["draft", "published"],
      question_type: ["ai_generated", "user_generated"],
    },
  },
} as const

