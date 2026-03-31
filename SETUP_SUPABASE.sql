-- Passo 3: Crea la tabella tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  subtasks JSONB DEFAULT '[]'::jsonb,
  recurrence JSONB,
  recurrence_master_id UUID,
  is_recurring_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crea indici per performance
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_user_id_date_idx ON tasks(user_id, date);

-- Abilita Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Crea policy per privacy (ogni utente vede solo i suoi task)
CREATE POLICY "Users can only see their own tasks"
ON tasks FOR ALL
USING (auth.uid() = user_id);

-- Passo 4: Abilita Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
