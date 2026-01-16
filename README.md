# 📋 Certificate Tools - Guida Veloce

## Cosa puoi fare con questa app?

✅ **Generare CSR + Chiave Privata** con tutti i parametri (CN, O, C, ST, L, OU)  
✅ **Creare PFX** da certificato + chiave con password  
✅ **Verificare match** tra certificato e chiave  
✅ **Estrarre** certificato e chiave da file PFX  

---

## 🚀 Deploy in 3 Minuti

### 1. Crea un account GitHub (se non ce l'hai)
https://github.com/signup

### 2. Crea un nuovo repository
- Nome: `certificate-tools`
- Privacy: Public o Private
- Click "Create repository"

### 3. Carica i file
Clona il repo localmente e copia dentro:
```
cert-app.jsx
package.json
vite.config.js
tailwind.config.js
postcss.config.js
index.html
src/main.jsx
src/index.css
DEPLOYMENT_GUIDE.md
.gitignore
```

Poi pusha:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 4. Deploy su Vercel (GRATUITO)
1. Vai a https://vercel.com
2. Clicca "Sign Up" → "Continue with GitHub"
3. Authorizza Vercel
4. Clicca "Add New" → "Project"
5. Seleziona il repo `certificate-tools`
6. Vercel farà tutto automaticamente
7. Click "Deploy"

**✅ Finito!** Hai il tuo link pubblico.

---

## 📱 Come usarlo

### Tab 1: CSR & Key
1. Riempi i campi (CN, O, C, etc.)
2. Scegli lunghezza chiave (2048 consigliato)
3. Click "Generate CSR & Key"
4. Scarica i file o copiali

### Tab 2: PFX Creator
1. Upload certificato firmato (.crt)
2. Upload chiave privata (.key)
3. Scegli una password
4. Click "Generate PFX"
5. Il file si scarica automaticamente

### Tab 3: Verify Match
1. Upload certificato (.crt)
2. Upload chiave privata (.key)
3. Click "Check Match"
4. Vedrai se corrispondono o no

### Tab 4: Extract PFX
1. Upload il tuo file PFX
2. Inserisci la password
3. Click "Extract"
4. Scarica certificato e chiave

---

## 🔒 Sicurezza

**IMPORTANTE:** Tutto è completamente locale nel browser.
- Zero dati su server
- Zero tracking
- Puoi usarla offline (scarica il repo e apri index.html localmente)

---

## 📝 Condividi con i colleghi

Basta che gli dai il link di Vercel:
```
https://certificate-tools.vercel.app
```

Non serve niente, funziona subito.

---

## 🛠️ Se vuoi modificare qualcosa

Modifica `cert-app.jsx`, fai push e Vercel si aggiorna automaticamente.

---

## ❓ FAQ

**Q: Posso usarla offline?**  
A: Sì, scarica la cartella e apri `index.html` nel browser.

**Q: I miei dati sono al sicuro?**  
A: Sì, tutto rimane nel tuo browser. Zero caricamenti su server.

**Q: Quanto costa?**  
A: Niente. Vercel è gratuito per progetti statici.

**Q: Posso usare Safari?**  
A: Sì, funziona su Chrome, Firefox, Edge, Safari.

---

Enjoy! 🎉
