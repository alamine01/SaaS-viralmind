export async function sendEmail({ to, subject, htmlContent }: { to: string; subject: string; htmlContent: string }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("DEBUG: BREVO_API_KEY manquante. Email non envoyé.");
    return { success: false, error: "API Key missing" };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "ViralMind", email: "noreply@viralmind.ai" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    return { success: true };
  } catch (error: any) {
    console.error("DEBUG: Erreur d'envoi Brevo:", error.message);
    return { success: false, error: error.message };
  }
}
