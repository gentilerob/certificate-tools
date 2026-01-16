# 🚀 Guida al Deploy su Vercel (GRATUITO)

## Step 1: Prepara il Repository su GitHub

### Se non hai GitHub:
1. Vai a https://github.com/signup (registrati)
2. Verifica l'email

### Se hai GitHub:
1. Crea un nuovo repository privato (opzionale):
   - Clicca "New repository"
   - Nome: `certificate-tools`
   - Privacy: Public o Private (come preferisci)
   - Click "Create repository"

2. Sul tuo PC, apri Terminal/CMD e fai:
```bash
git clone https://github.com/TUO_USERNAME/certificate-tools.git
cd certificate-tools
```

3. Copia tutti questi file dentro la cartella:
   - `cert-app.jsx` → rinominalo `App.jsx`
   - `package.json`
   - Crea anche:
     - `vite.config.js`
     - `tailwind.config.js`
     - `postcss.config.js`
     - `index.html`
     - `src/main.jsx`
     - `src/index.css`

4. Pusha su GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

---

## Step 2: Setup Vercel (2 minuti)

1. Vai a https://vercel.com
2. Clicca "Sign Up" → Seleziona "Continue with GitHub"
3. Authorizza Vercel ad accedere ai tuoi repo GitHub
4. Una volta loggato, clicca "Add New..." → "Project"
5. Seleziona il repository `certificate-tools`
6. Vercel rileverà automaticamente Vite:
   - Framework: **Vite**
   - Build Command: **npm run build** (auto-rilevato)
   - Output Directory: **dist** (auto-rilevato)
7. Clicca "Deploy"

**Fine!** In ~1 minuto avrai il link pubblico tipo:
`https://certificate-tools.vercel.app`

---

## Step 3: File di Setup Necessari

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### tailwind.config.js
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### index.html
```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate Tools</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

### src/main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../cert-app'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## Step 4: Condividi con i Colleghi

Una volta deployato, il link è accessibile a tutti. Basta che i tuoi colleghi vadano su:
```
https://certificate-tools.vercel.app
```

Non serve installare niente, nessun login, completamente gratis.

---

## Troubleshooting

**Errore: "Cannot find module node-forge"**
→ Non serve installarla! L'app la carica direttamente da CDN (cdnjs)

**La build fallisce**
→ Controlla che tutti i file siano nella cartella giusta
→ Guarda i "Build Logs" su Vercel (sezione Deployments)

**Vuoi aggiungere funzionalità?**
→ Modifica il file `App.jsx` locally
→ Fai `git push` e Vercel si aggiornerà automaticamente

---

## Note di Sicurezza

✅ **Tutto è completamente locale nel browser**
- I file CSR, chiavi, certificati **rimangono solo nel tuo PC**
- Zero dati su server Vercel
- node-forge fa tutto il lavoro nel browser

---

Fatto! Condividi il link ai colleghi e avrai la tua certificate app pronta! 🎉
