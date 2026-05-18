import { AuthForm } from "@/components/auth-form"

export const metadata = {
  title: "Inscription - ViralMind",
  description: "Créez votre compte ViralMind",
}

export default function SignUp() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] py-12">
      <AuthForm mode="signup" />
    </div>
  )
}
