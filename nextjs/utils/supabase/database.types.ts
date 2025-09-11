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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      candidate_aggregated_interview_analysis: {
        Row: {
          candidate_id: string
          created_at: string
          hiring_verdict: Database["public"]["Enums"]["hiring_verdict"]
          id: string
          overall_score: number
          updated_at: string
          verdict_rationale: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          hiring_verdict: Database["public"]["Enums"]["hiring_verdict"]
          id?: string
          overall_score: number
          updated_at?: string
          verdict_rationale: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          hiring_verdict?: Database["public"]["Enums"]["hiring_verdict"]
          id?: string
          overall_score?: number
          updated_at?: string
          verdict_rationale?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_aggregated_interview_analysis_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_application_additional_info: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          updated_at: string
          value: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          updated_at?: string
          value: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_application_additional_info_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_application_files: {
        Row: {
          candidate_id: string
          created_at: string
          file_id: string
          id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          file_id: string
          id?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          file_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_application_files_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_application_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_job_alignment_details: {
        Row: {
          alignment_score: number
          candidate_id: string
          created_at: string
          exceeded_requirements: string[] | null
          id: string
          matched_requirements: string[] | null
          missing_requirements: string[] | null
        }
        Insert: {
          alignment_score: number
          candidate_id: string
          created_at?: string
          exceeded_requirements?: string[] | null
          id?: string
          matched_requirements?: string[] | null
          missing_requirements?: string[] | null
        }
        Update: {
          alignment_score?: number
          candidate_id?: string
          created_at?: string
          exceeded_requirements?: string[] | null
          id?: string
          matched_requirements?: string[] | null
          missing_requirements?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_alignment_details_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_job_interview_messages: {
        Row: {
          candidate_interview_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["message_role"]
          text: string
        }
        Insert: {
          candidate_interview_id: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["message_role"]
          text: string
        }
        Update: {
          candidate_interview_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_messages_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: false
            referencedRelation: "candidate_job_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_messages_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["candidate_interview_id"]
          },
        ]
      }
      candidate_job_interview_recordings: {
        Row: {
          asset_id: string | null
          created_at: string | null
          id: string
          playback_id: string | null
          status: Database["public"]["Enums"]["mux_status"]
          updated_at: string | null
          upload_id: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          id: string
          playback_id?: string | null
          status?: Database["public"]["Enums"]["mux_status"]
          updated_at?: string | null
          upload_id?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          id?: string
          playback_id?: string | null
          status?: Database["public"]["Enums"]["mux_status"]
          updated_at?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_recordings_candidate_interview_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "candidate_job_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_recordings_candidate_interview_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["candidate_interview_id"]
          },
        ]
      }
      candidate_job_interviews: {
        Row: {
          candidate_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          interview_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_interview_status"]
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          interview_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_interview_status"]
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          interview_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_interview_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_interviews_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "job_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
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
      companies: {
        Row: {
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_application_stages: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order_index: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_application_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_interview_coding_question_metadata: {
        Row: {
          created_at: string
          id: string
          time_limit_ms: number
        }
        Insert: {
          created_at?: string
          id: string
          time_limit_ms: number
        }
        Update: {
          created_at?: string
          id?: string
          time_limit_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_interview_coding_question_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "company_interview_coding_question_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "company_interview_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      company_interview_question_bank: {
        Row: {
          answer: string
          company_id: string
          created_at: string | null
          id: string
          question: string
          question_type: Database["public"]["Enums"]["job_interview_type"]
          updated_at: string | null
        }
        Insert: {
          answer: string
          company_id: string
          created_at?: string | null
          id?: string
          question: string
          question_type?: Database["public"]["Enums"]["job_interview_type"]
          updated_at?: string | null
        }
        Update: {
          answer?: string
          company_id?: string
          created_at?: string | null
          id?: string
          question?: string
          question_type?: Database["public"]["Enums"]["job_interview_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_interview_question_bank_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_job_candidates: {
        Row: {
          applied_at: string
          candidate_user_id: string
          company_id: string
          created_at: string
          current_stage_id: string | null
          custom_job_id: string
          id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          candidate_user_id: string
          company_id: string
          created_at?: string
          current_stage_id?: string | null
          custom_job_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          candidate_user_id?: string
          company_id?: string
          created_at?: string
          current_stage_id?: string | null
          custom_job_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_job_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_job_candidates_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "company_application_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_job_candidates_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          id: string
          invitation_email: string | null
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["company_member_role"]
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          invitation_email?: string | null
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          role: Database["public"]["Enums"]["company_member_role"]
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          invitation_email?: string | null
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["company_member_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["course_content_type"]
          created_at: string
          file_id: string | null
          id: string
          lesson_id: string
          order_index: number
          text_content: string | null
          updated_at: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["course_content_type"]
          created_at?: string
          file_id?: string | null
          id?: string
          lesson_id: string
          order_index: number
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["course_content_type"]
          created_at?: string
          file_id?: string | null
          id?: string
          lesson_id?: string
          order_index?: number
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_blocks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "course_lesson_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson_files: {
        Row: {
          bucket_name: string
          coach_id: string
          created_at: string
          display_name: string
          file_path: string
          google_file_name: string | null
          google_file_uri: string | null
          id: string
          lesson_id: string
          mime_type: string
        }
        Insert: {
          bucket_name?: string
          coach_id: string
          created_at?: string
          display_name: string
          file_path: string
          google_file_name?: string | null
          google_file_uri?: string | null
          id?: string
          lesson_id: string
          mime_type: string
        }
        Update: {
          bucket_name?: string
          coach_id?: string
          created_at?: string
          display_name?: string
          file_path?: string
          google_file_name?: string | null
          google_file_uri?: string | null
          id?: string
          lesson_id?: string
          mime_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_files_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson_files_mux_metadata: {
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
            foreignKeyName: "course_lesson_files_mux_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "course_lesson_files"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          created_at: string
          id: string
          module_id: string
          order_index: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          order_index: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          order_index?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_index: number
          published: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_index: number
          published?: boolean
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          published?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          custom_job_id: string
          deletion_status: Database["public"]["Enums"]["deletion_status"]
          id: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_job_id: string
          deletion_status?: Database["public"]["Enums"]["deletion_status"]
          id?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_job_id?: string
          deletion_status?: Database["public"]["Enums"]["deletion_status"]
          id?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: true
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
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
      custom_job_enrollments: {
        Row: {
          coach_id: string
          created_at: string
          custom_job_id: string
          id: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          custom_job_id: string
          id?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          custom_job_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_enrollments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_job_enrollments_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
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
      custom_job_knowledge_base: {
        Row: {
          created_at: string
          custom_job_id: string
          id: string
          knowledge_base: string
        }
        Insert: {
          created_at?: string
          custom_job_id: string
          id?: string
          knowledge_base: string
        }
        Update: {
          created_at?: string
          custom_job_id?: string
          id?: string
          knowledge_base?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_knowledge_base_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: true
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_job_knowledge_base_files: {
        Row: {
          bucket_name: string
          coach_id: string
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
          bucket_name: string
          coach_id: string
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
          bucket_name?: string
          coach_id?: string
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
            foreignKeyName: "custom_job_knowledge_base_files_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_job_knowledge_base_files_custom_job_id_fkey"
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
          candidate_id: string | null
          created_at: string
          custom_job_id: string
          id: string
          interview_prompt: string
          recording_file_path: string | null
          status: Database["public"]["Enums"]["interview_status"]
          user_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          custom_job_id: string
          id?: string
          interview_prompt: string
          recording_file_path?: string | null
          status: Database["public"]["Enums"]["interview_status"]
          user_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          custom_job_id?: string
          id?: string
          interview_prompt?: string
          recording_file_path?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_job_mock_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
        }
        Insert: {
          answer_guidelines: string
          created_at?: string
          custom_job_id: string
          id?: string
          publication_status?: Database["public"]["Enums"]["question_publication_status"]
          question: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          answer_guidelines?: string
          created_at?: string
          custom_job_id?: string
          id?: string
          publication_status?: Database["public"]["Enums"]["question_publication_status"]
          question?: string
          question_type?: Database["public"]["Enums"]["question_type"]
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
          coach_id: string | null
          company_description: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          id: string
          job_description: string | null
          job_title: string
          status: Database["public"]["Enums"]["custom_job_access"]
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          company_description?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_title: string
          status: Database["public"]["Enums"]["custom_job_access"]
          user_id: string
        }
        Update: {
          coach_id?: string | null
          company_description?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_title?: string
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
            foreignKeyName: "custom_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      job_interview_coding_submissions: {
        Row: {
          candidate_interview_id: string
          created_at: string | null
          id: string
          question_id: string
          submission_number: number
          submission_text: string
        }
        Insert: {
          candidate_interview_id: string
          created_at?: string | null
          id?: string
          question_id: string
          submission_number: number
          submission_text: string
        }
        Update: {
          candidate_interview_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          submission_number?: number
          submission_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_coding_submissions_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: false
            referencedRelation: "candidate_job_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_coding_submissions_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["candidate_interview_id"]
          },
          {
            foreignKeyName: "job_interview_coding_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "job_interview_coding_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "company_interview_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      job_interview_questions: {
        Row: {
          created_at: string | null
          id: string
          interview_id: string
          order_index: number
          question_id: string
          weight: Database["public"]["Enums"]["interview_weight"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          interview_id: string
          order_index: number
          question_id: string
          weight?: Database["public"]["Enums"]["interview_weight"]
        }
        Update: {
          created_at?: string | null
          id?: string
          interview_id?: string
          order_index?: number
          question_id?: string
          weight?: Database["public"]["Enums"]["interview_weight"]
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_questions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "job_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "job_interview_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "company_interview_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      job_interviews: {
        Row: {
          created_at: string | null
          custom_job_id: string
          id: string
          interview_type: Database["public"]["Enums"]["job_interview_type"]
          name: string
          order_index: number
          updated_at: string | null
          weight: Database["public"]["Enums"]["interview_weight"]
        }
        Insert: {
          created_at?: string | null
          custom_job_id: string
          id?: string
          interview_type?: Database["public"]["Enums"]["job_interview_type"]
          name: string
          order_index: number
          updated_at?: string | null
          weight?: Database["public"]["Enums"]["interview_weight"]
        }
        Update: {
          created_at?: string | null
          custom_job_id?: string
          id?: string
          interview_type?: Database["public"]["Enums"]["job_interview_type"]
          name?: string
          order_index?: number
          updated_at?: string | null
          weight?: Database["public"]["Enums"]["interview_weight"]
        }
        Relationships: [
          {
            foreignKeyName: "job_interviews_custom_job_id_fkey"
            columns: ["custom_job_id"]
            isOneToOne: false
            referencedRelation: "custom_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_gcp_storage_metadata: {
        Row: {
          bucket_name: string
          created_at: string
          file_path: string
          id: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          file_path: string
          id: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          file_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_gcp_storage_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "custom_job_mock_interviews"
            referencedColumns: ["id"]
          },
        ]
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
      mock_interview_mux_metadata: {
        Row: {
          asset_id: string | null
          created_at: string
          id: string
          playback_id: string | null
          status: Database["public"]["Enums"]["mux_status"]
          upload_id: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          id: string
          playback_id?: string | null
          status: Database["public"]["Enums"]["mux_status"]
          upload_id?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          id?: string
          playback_id?: string | null
          status?: Database["public"]["Enums"]["mux_status"]
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_google_storage_metadata_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
      recruiter_interview_analysis: {
        Row: {
          candidate_interview_id: string
          created_at: string
          hiring_verdict: Database["public"]["Enums"]["hiring_verdict"]
          id: string
          input_token_count: number | null
          model_used: string | null
          output_token_count: number | null
          overall_match_score: number
          processing_duration_ms: number | null
          updated_at: string
          verdict_summary: string
        }
        Insert: {
          candidate_interview_id: string
          created_at?: string
          hiring_verdict: Database["public"]["Enums"]["hiring_verdict"]
          id?: string
          input_token_count?: number | null
          model_used?: string | null
          output_token_count?: number | null
          overall_match_score: number
          processing_duration_ms?: number | null
          updated_at?: string
          verdict_summary: string
        }
        Update: {
          candidate_interview_id?: string
          created_at?: string
          hiring_verdict?: Database["public"]["Enums"]["hiring_verdict"]
          id?: string
          input_token_count?: number | null
          model_used?: string | null
          output_token_count?: number | null
          overall_match_score?: number
          processing_duration_ms?: number | null
          updated_at?: string
          verdict_summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_interview_analysis_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: true
            referencedRelation: "candidate_job_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_interview_analysis_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: true
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["candidate_interview_id"]
          },
        ]
      }
      recruiter_interview_concerns: {
        Row: {
          analysis_id: string
          created_at: string
          description: string
          evidence: string
          id: string
          title: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          description: string
          evidence: string
          id?: string
          title: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          description?: string
          evidence?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_interview_concerns_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "recruiter_interview_concerns_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_interview_concerns_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_interview_highlights: {
        Row: {
          analysis_id: string
          context: string
          created_at: string
          display_order: number | null
          highlight_type: string
          id: string
          quote: string
          timestamp_seconds: number | null
        }
        Insert: {
          analysis_id: string
          context: string
          created_at?: string
          display_order?: number | null
          highlight_type: string
          id?: string
          quote: string
          timestamp_seconds?: number | null
        }
        Update: {
          analysis_id?: string
          context?: string
          created_at?: string
          display_order?: number | null
          highlight_type?: string
          id?: string
          quote?: string
          timestamp_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_interview_highlights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "recruiter_interview_highlights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_interview_highlights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_interview_insights: {
        Row: {
          analysis_id: string
          category: string | null
          created_at: string
          description: string
          evidence: Json | null
          id: string
          insight_type: string
          priority: number | null
          title: string
        }
        Insert: {
          analysis_id: string
          category?: string | null
          created_at?: string
          description: string
          evidence?: Json | null
          id?: string
          insight_type: string
          priority?: number | null
          title: string
        }
        Update: {
          analysis_id?: string
          category?: string | null
          created_at?: string
          description?: string
          evidence?: Json | null
          id?: string
          insight_type?: string
          priority?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_interview_insights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "recruiter_interview_insights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_interview_insights_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_interview_strengths: {
        Row: {
          analysis_id: string
          created_at: string
          display_order: number | null
          evidence: string
          id: string
          relevance: string
          title: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          display_order?: number | null
          evidence: string
          id?: string
          relevance: string
          title: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          display_order?: number | null
          evidence?: string
          id?: string
          relevance?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_interview_strengths_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "recruiter_interview_strengths_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_interview_strengths_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_job_alignment_details: {
        Row: {
          analysis_id: string
          created_at: string
          exceeded_requirements: string[] | null
          id: string
          matched_requirements: string[] | null
          missing_requirements: string[] | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          exceeded_requirements?: string[] | null
          id?: string
          matched_requirements?: string[] | null
          missing_requirements?: string[] | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          exceeded_requirements?: string[] | null
          id?: string
          matched_requirements?: string[] | null
          missing_requirements?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_job_alignment_details_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "recruiter_job_alignment_details_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "recruiter_interview_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_job_alignment_details_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "recruiter_interview_analysis_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_question_analysis: {
        Row: {
          analysis_id: string
          answer_quality_score: number | null
          concerns: string[] | null
          created_at: string
          display_order: number | null
          examples_provided: string[] | null
          id: string
          key_points: string[] | null
          question_id: string | null
          question_text: string
          user_answer: string
        }
        Insert: {
          analysis_id: string
          answer_quality_score?: number | null
          concerns?: string[] | null
          created_at?: string
          display_order?: number | null
          examples_provided?: string[] | null
          id?: string
          key_points?: string[] | null
          question_id?: string | null
          question_text: string
          user_answer: string
        }
        Update: {
          analysis_id?: string
          answer_quality_score?: number | null
          concerns?: string[] | null
          created_at?: string
          display_order?: number | null
          examples_provided?: string[] | null
          id?: string
          key_points?: string[] | null
          question_id?: string | null
          question_text?: string
          user_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_question_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["analysis_id"]
          },
          {
            foreignKeyName: "recruiter_question_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_question_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "recruiter_interview_analysis_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_question_analysis_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "recruiter_question_analysis_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "company_interview_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_subscriptions: {
        Row: {
          company_id: string
          created_at: string
          stripe_customer_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          stripe_customer_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          stripe_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_subscriptions_metered_usage: {
        Row: {
          company_id: string
          count: number
          created_at: string
        }
        Insert: {
          company_id: string
          count: number
          created_at?: string
        }
        Update: {
          company_id?: string
          count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_subscriptions_metered_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
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
      coding_interview_analysis_view: {
        Row: {
          analysis_created_at: string | null
          analysis_id: string | null
          candidate_id: string | null
          candidate_interview_id: string | null
          completed_at: string | null
          hiring_verdict: Database["public"]["Enums"]["hiring_verdict"] | null
          interview_id: string | null
          interview_status:
            | Database["public"]["Enums"]["job_interview_status"]
            | null
          interview_strengths: Json | null
          interview_weaknesses: Json | null
          model_used: string | null
          overall_match_score: number | null
          processing_duration_ms: number | null
          question_answer: string | null
          question_id: string | null
          question_text: string | null
          question_type:
            | Database["public"]["Enums"]["job_interview_type"]
            | null
          started_at: string | null
          user_last_submission: string | null
          verdict_summary: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "company_job_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_interviews_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "job_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_interview_analysis_complete: {
        Row: {
          candidate_interview_id: string | null
          concerns: Json | null
          created_at: string | null
          exceeded_requirements: string[] | null
          highlights: Json | null
          hiring_verdict: Database["public"]["Enums"]["hiring_verdict"] | null
          id: string | null
          input_token_count: number | null
          insights: Json | null
          matched_requirements: string[] | null
          missing_requirements: string[] | null
          model_used: string | null
          output_token_count: number | null
          overall_match_score: number | null
          processing_duration_ms: number | null
          question_analysis: Json | null
          strengths: Json | null
          updated_at: string | null
          verdict_summary: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_interview_analysis_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: true
            referencedRelation: "candidate_job_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiter_interview_analysis_candidate_interview_id_fkey"
            columns: ["candidate_interview_id"]
            isOneToOne: true
            referencedRelation: "coding_interview_analysis_view"
            referencedColumns: ["candidate_interview_id"]
          },
        ]
      }
    }
    Functions: {
      get_user_id_by_email: {
        Args: { p_email: string }
        Returns: string
      }
      is_company_member: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: boolean
      }
      is_company_owner_or_admin: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      company_member_role: "owner" | "admin" | "recruiter" | "viewer"
      course_content_type: "text" | "pdf" | "video" | "image"
      custom_job_access: "locked" | "unlocked"
      deletion_status: "deleted" | "not_deleted"
      feedback_role: "ai" | "user"
      hiring_verdict: "ADVANCE" | "REJECT" | "BORDERLINE"
      interview_copilot_access: "locked" | "unlocked"
      interview_copilot_status: "in_progress" | "complete"
      interview_status: "in_progress" | "complete"
      interview_weight: "low" | "normal" | "high"
      job_interview_status: "pending" | "in_progress" | "completed"
      job_interview_type: "general" | "coding"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      company_member_role: ["owner", "admin", "recruiter", "viewer"],
      course_content_type: ["text", "pdf", "video", "image"],
      custom_job_access: ["locked", "unlocked"],
      deletion_status: ["deleted", "not_deleted"],
      feedback_role: ["ai", "user"],
      hiring_verdict: ["ADVANCE", "REJECT", "BORDERLINE"],
      interview_copilot_access: ["locked", "unlocked"],
      interview_copilot_status: ["in_progress", "complete"],
      interview_status: ["in_progress", "complete"],
      interview_weight: ["low", "normal", "high"],
      job_interview_status: ["pending", "in_progress", "completed"],
      job_interview_type: ["general", "coding"],
      locked_status: ["locked", "unlocked"],
      message_role: ["user", "model"],
      mux_status: ["preparing", "ready", "errored"],
      question_publication_status: ["draft", "published"],
      question_type: ["ai_generated", "user_generated"],
    },
  },
} as const

