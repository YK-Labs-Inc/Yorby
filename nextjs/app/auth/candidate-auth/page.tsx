import { CandidateAuthForm } from '@/components/candidate-auth-form'

export default function CandidateAuthPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <CandidateAuthForm />
      </div>
    </div>
  )
}