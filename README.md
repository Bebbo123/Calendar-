# SmartCalendar+

Una web app moderna per la gestione intelligente delle scadenze con **sincronizzazione multi-dispositivo via Supabase**.

## 🚀 Accesso al Calendario

### Sviluppo Locale
```bash
npm install
npm run dev
```
📌 **Link di accesso**: http://localhost:5173/Calendar-/

Il calendario sarà disponibile in tempo reale con hot reload.

### Produzione
Per deployare su GitHub Pages:
```bash
npm run deploy:gh-pages
```

## 🔐 Sincronizzazione Multi-Dispositivo con Supabase

### Come Funziona
- **Autenticazione Supabase**: Ogni utente accede con email/password (auto-registrazione su primo login)
- **PostgreSQL Real-Time**: I task di ogni utente sono salvati in Supabase e sincronizzati istantaneamente
- **Offline Support**: I dati sono salvati anche localmente come fallback se Supabase non è disponibile

### ⚡ Vantaggi di Supabase
- ✅ **Backend ospitato** - Nessun server locale necessario
- ✅ **PostgreSQL** - Database relazionale affidabile
- ✅ **Real-time** - Sincronizzazione istantanea tra dispositivi
- ✅ **Gratuito** - Tier free generoso per progetti personali
- ✅ **Open Source** - Alternativa a Firebase

### 📋 Setup Supabase

#### 1. Crea un Account Supabase
1. Vai a https://app.supabase.com
2. Crea un nuovo progetto
3. Salva la **Project URL** e la **Anon Key**

#### 2. Configura le Variabili di Ambiente
Crea il file `.env.local`:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

#### 3. Crea la Tabella `tasks` in Supabase
Vai in SQL Editor su Supabase e esegui:
```sql
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

-- Indici per performance
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_user_id_date_idx ON tasks(user_id, date);

-- RLS (Row Level Security) - Ogni utente può vedere solo i suoi task
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own tasks"
ON tasks FOR ALL
USING (auth.uid() = user_id);
```

#### 4. Abilita Realtime (SQL Editor)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

### 🧪 Test Multi-Dispositivo
1. **PC**: Apri il calendario su http://localhost:5173/Calendar-/
2. **Telefono**: Apri su un'altra rete o dispositivo
3. **Login**: Accedi con le stesse credenziali su entrambi i dispositivi
4. **Test**: Aggiungi/modifica un task su un dispositivo e vedilo sincronizzare istantaneamente sull'altro

### 🏗️ Architettura Sincronizzazione
```
┌─────────────────┐
│  Dispositivo 1  │ ◄─────────┐
│   (PC)          │           │ Real-time sync
│  localStorage   │           │ via Supabase
└────────┬────────┘      ┌────┴──────────────┐
         │               │                  │
         └──────►Supabase PostgreSQL◄────────┘
                 tasks table              
         ┌───────────────────────────────┐
         │                               │
┌────────▼────────┐          ┌──────────▼──────┐
│  Dispositivo 2  │          │  Dispositivo 3  │
│   (Telefono)    │          │   (Tablet)      │
│  localStorage   │          │  localStorage   │
└─────────────────┘          └─────────────────┘
```

## ✨ Funzionalità

- 📅 Calendario mensile interattivo con badge priorità
- 🎨 Sistema smart di priorità (urgente, alto, medio, basso)
- 📊 Dashboard analitica con statistiche in tempo reale
- ➕ Inserimento rapido task con categorie e priorità
- 🔐 Autenticazione con Supabase
- ☁️ Sincronizzazione cloud dei dati
- 📱 Design responsive e Apple-like
- 🔄 **Sincronizzazione automatica tra dispositivi**
- ⚡ **Real-time updates con PostgreSQL**

## 🛠️ Stack Tecnologico

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Date Management**: date-fns
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📖 Utilizzo

### Primo Accesso
1. Apri il calendario al link locale o in produzione
2. Accedi con email/password (si auto-registra al primo login)
3. Inizia a gestire i tuoi task

### Gestione Task
1. **Crea**: Clicca "Nuovo Task" per aggiungere una scadenza
2. **Visualizza**: Accedi al calendario mensile e vedi i task per giorno
3. **Dettagli**: Clicca su un giorno per vedere i dettagli completi
4. **Completa**: Seleziona il checkbox per segnare come completato
5. **Elimina**: Usa il pulsante ✕ per rimuovere un task

### Priorità Task
- 🔴 **Urgente**: Scadenza imminente
- 🟠 **Alto**: Da completare presto
- 🟡 **Medio**: Moderata importanza
- 🟢 **Basso**: Meno urgente

## 🏗️ Architettura Progetto

```
Calendar- (Root)
├── src/
│   ├── components/        # Componenti UI riutilizzabili
│   │   ├── Login.tsx      # Autenticazione
│   │   ├── Sidebar.tsx    # Navigazione principale
│   │   ├── TaskModal.tsx  # Form creazione task
│   │   └── TaskDetailModal.tsx  # Dettagli task
│   ├── features/          # Logica business per feature
│   │   ├── calendar/      # Visualizzazione calendario
│   │   ├── dashboard/     # Statistiche e analytics
│   │   └── tasks/         # Gestione task
│   ├── hooks/             # Custom React hooks
│   │   └── useTasks.ts    # Logica gestione task
│   ├── services/          # API e integrazione esterna
│   │   ├── supabaseService.ts   # Connessione Supabase
│   │   └── taskService.ts       # Business logic task
│   ├── types/             # Definizioni TypeScript
│   └── utils/             # Utility e helper
│       ├── priorityUtils.ts    # Gestione priorità
│       └── recurrenceUtils.ts  # Task ricorrenti
└── package.json
```

## 🔧 Comandi Disponibili

| Comando | Descrizione |
|---------|-----------|
| `npm run dev` | Avvia server di sviluppo (hot reload) |
| `npm run build` | Build ottimizzato per produzione |
| `npm run preview` | Anteprima build locale |
| `npm run lint` | Verifica codice TypeScript/ESLint |
| `npm run deploy:gh-pages` | Deploy automatico su GitHub Pages |

## 📦 Installazione & Setup

### Prerequisiti
- Node.js 16+
- npm o yarn
- Account Supabase (gratuito)

### Passi

1. **Clone il repository**
   ```bash
   git clone <repository-url>
   cd Calendar-
   ```

2. **Installa dipendenze**
   ```bash
   npm install
   ```

3. **Configura Supabase** (vedi sezione Setup Supabase)
   - Crea `.env.local` con le credenziali
   - Esegui lo script SQL per creare le tabelle

4. **Avvia lo sviluppo**
   ```bash
   npm run dev
   ```

5. **Accedi al calendario**
   - Apri http://localhost:5173/Calendar-/

## 🚀 Deploy su GitHub Pages

Per deployare l'app automaticamente su GitHub Pages:

```bash
npm run deploy:gh-pages
```

L'app sarà disponibile a: `https://<username>.github.io/Calendar-/`

⚠️ **Nota**: Se usi GitHub Pages, assicurati che:
1. Le credenziali Supabase siano in `.env.local` (non in git)
2. Abilita le credenziali CORS in Supabase per il tuo dominio

## 💡 Tips & Tricks

- **Auto-login**: Se perdi la connessione, l'app usa i dati in localStorage
- **Task ricorrenti**: Crea task che si ripetono ogni giorno/settimana/mese
- **Categorie**: Organizza i task per Lavoro, Personale, Finanza
- **Sincronizzazione**: I task si sincronizzano istantaneamente tra i tuoi dispositivi

## 📝 License

MIT

---

**Versione attuale**: 0.0.0  
**Ultimo aggiornamento**: Marzo 2026  
**Backend**: Supabase