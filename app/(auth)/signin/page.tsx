import { AuthForm } from "@/components/auth-form"

export const metadata = {
  title: "Connexion - ViralMind",
  description: "Connectez-vous à votre compte ViralMind",
}

export default function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] py-12">
      <AuthForm />
    </div>
  )
}
