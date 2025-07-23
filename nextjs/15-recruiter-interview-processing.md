# 15. Recruiter Interview Processing Structure

This rule defines the structure and insights generated when processing AI interviews for recruiters (B2B) as opposed to candidates (B2C).

## Overview

The recruiter interview processing endpoint analyzes candidate interviews to provide actionable hiring insights. Unlike candidate-focused feedback which emphasizes improvement, recruiter feedback is optimized for quick decision-making with supporting evidence.

## Two-Tier Feedback System

The system provides two levels of detail to balance speed and thoroughness:

### Primary Feedback (Essential - Above the Fold)

These are the critical insights a recruiter needs to make a hiring decision in 30 seconds:

#### 1. **Hiring Verdict**
- **Recommendation**: `ADVANCE` / `REJECT` / `BORDERLINE`
- **One-line summary**: Brief explanation of the recommendation (e.g., "Strong technical match but lacks leadership experience")
- **Overall match score**: Percentage (0-100%)

#### 2. **Key Strengths** (Top 3)
- Specific, evidence-based strengths from the interview
- Include concrete examples where possible
- Focus on job-relevant achievements

#### 3. **Key Concerns** (Top 3)
- Specific gaps or issues identified
- Missing required skills or experience
- Behavioral or cultural fit concerns

#### 4. **Red Flags** (if any)
- Only include deal-breakers
- Format with ⚠️ icon for visibility
- Examples:
  - Resume contradictions
  - Employment gaps
  - Unprofessional behavior
  - Inability to provide specific examples

#### 5. **Recommended Next Steps**
- Actionable items for the recruiter
- Format with ✓ checkmark
- Examples:
  - Technical assessments needed
  - Reference check focus areas
  - Follow-up interview topics
  - Team members to involve

### Secondary Feedback (Detailed - Below the Fold/Expandable)

Additional insights for borderline cases or when more depth is needed:

#### 6. **Question-by-Question Analysis**
- Each interview question with:
  - Answer quality score (0-100%)
  - Key points from response
  - Specific concerns or highlights
  - Examples provided by candidate

#### 7. **Job Description Alignment Details**
- **Alignment Score**: X% (overall match to job requirements)
- Breakdown by requirement:
  - Required skills: demonstrated vs. missing
  - Experience level: matches/exceeds/lacks
  - Technical competencies checklist
  - Soft skills assessment

#### 8. **Interview Transcript Highlights**
- Best answers with timestamps
- Concerning responses with timestamps
- Key quotes demonstrating:
  - Strong fit indicators
  - Areas of concern
  - Cultural alignment
  - Technical expertise

#### 9. **Detailed Scoring Breakdown**
- Technical skills: X%
- Relevant experience: X%
- Leadership/soft skills: X%
- Culture fit indicators: X%
- Problem-solving ability: X%

#### 10. **Experience Verification Report**
- Timeline consistency analysis
- Role/responsibility verification
- Achievement claims assessment
- Recommended reference check questions
- Areas requiring technical validation

## Data Requirements

To generate these insights, the system needs:
- **Job description** (from `custom_jobs` table)
- **Interview questions** (from `custom_job_questions` table)
- **Interview transcript** (full conversation)
- **Candidate application materials** (optional - from `candidate_application_files`)

## Key Differences from B2C (Mock Interview) Processing

| Aspect | B2C (Candidates) | B2B (Recruiters) |
|--------|------------------|------------------|
| **Focus** | Improvement & learning | Hiring decision |
| **Tone** | Encouraging & educational | Objective & evaluative |
| **Structure** | Detailed feedback per question | Summary with drill-down option |
| **Scoring** | Progress-oriented | Threshold-based (hire/no-hire) |
| **Output** | Areas to improve | Evidence for decisions |

## Implementation Guidelines

1. **Performance**: Primary feedback should generate quickly (<3 seconds)
2. **Clarity**: Use clear ADVANCE/REJECT/BORDERLINE language
3. **Evidence**: Every claim must reference specific interview moments
4. **Actionability**: Next steps must be concrete and executable
5. **Scannability**: Use formatting (bullets, bold, icons) for quick scanning

## Database Considerations

Consider creating a dedicated table structure for recruiter feedback:
- `recruiter_interview_analysis` - Main analysis results
- `recruiter_interview_insights` - Individual insights/findings
- `recruiter_interview_scores` - Detailed scoring breakdown

This ensures separation from B2C mock interview data and allows for recruiter-specific features like comparison across candidates. 