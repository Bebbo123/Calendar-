# SmartCalendar+

Una web app moderna per la gestione intelligente delle scadenze, ispirata a SmartCalendar+.

## Funzionalità

- 📅 Calendario mensile interattivo con badge priorità
- 🎨 Sistema smart di priorità (urgente, alto, medio, basso)
- 📊 Dashboard analitica con statistiche in tempo reale
- ➕ Inserimento rapido task con categorie e priorità
- 💾 Persistenza dati con localStorage
- 📱 Design responsive e Apple-like

## Stack Tecnologico

- React + TypeScript
- Tailwind CSS
- date-fns
- Lucide React

## Installazione

```bash
npm install
npm run dev
```

Apri http://localhost:5173 nel browser.

## Utilizzo

1. Clicca "Nuovo Task" per aggiungere una scadenza
2. Visualizza i task nel calendario mensile
3. Clicca su un giorno per vedere i dettagli
4. Completa task cliccando sul checkbox
5. Elimina task con il pulsante ✕

## Architettura

- **Components**: Componenti UI riutilizzabili
- **Features**: Logica per calendario, task, dashboard
- **Services**: Gestione dati (localStorage)
- **Hooks**: Logica custom (useTasks)
- **Utils**: Utility per priorità e date
- **Types**: Definizioni TypeScript