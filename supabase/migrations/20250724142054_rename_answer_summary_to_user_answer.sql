-- Rename answer_summary column to user_answer in recruiter_question_analysis table
ALTER TABLE recruiter_question_analysis 
RENAME COLUMN answer_summary TO user_answer;