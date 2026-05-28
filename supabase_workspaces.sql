-- Création de la table des workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    color TEXT DEFAULT 'bg-indigo-400',
    voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir uniquement leurs propres workspaces
CREATE POLICY "Users can view their own workspaces" 
ON workspaces FOR SELECT 
USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs d'insérer leurs propres workspaces
CREATE POLICY "Users can insert their own workspaces" 
ON workspaces FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres workspaces
CREATE POLICY "Users can delete their own workspaces" 
ON workspaces FOR DELETE 
USING (auth.uid() = user_id);
