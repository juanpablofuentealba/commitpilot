# CommitPilot — Pasos para mañana

Repo: https://github.com/juanpablofuentealba/commitpilot
Ruta local: ~/dev/commitpilot

## ✅ Ya está hecho (no tocar)
- [x] Repo público en GitHub
- [x] CLI funcional (commit / changelog / pr / install-hook)
- [x] 11 tests pasando
- [x] CI en GitHub Actions funcionando (verde)
- [x] Landing HTML con SEO en `site/`
- [x] Netlify CLI instalado (v27.14.2)
- [x] `netlify.toml` + scripts de deploy
- [x] README, LICENSE (MIT), .gitignore

## ⏳ Falta (necesita TU acción)

### 1. API key de OpenRouter (para probar CommitPilot)
```bash
# Crea una gratis en https://openrouter.ai/keys
echo 'export OPENROUTER_API_KEY="sk-or-TU-KEY"' >> ~/.bashrc
source ~/.bashrc

# Probar:
cd ~/dev/commitpilot
npm link
git add .
commitpilot commit
```

### 2. Deploy de la landing en Netlify
```bash
cd ~/dev/commitpilot
./setup-netlify.sh       # hace login + crea sitio + deploy
```
O manual:
```bash
netlify login
netlify sites:create --name commitpilot
netlify link
netlify deploy --prod --dir=site
```

### 3. Publicar en npm (opcional)
```bash
# Necesitas cuenta npm: https://www.npmjs.com/signup
npm login
cd ~/dev/commitpilot
npm publish --access public
```

## 🔜 Próximos módulos posibles
- DocGen: genera README/docs de un repo
- TestGen: genera tests con IA
- GitHub Action que comenta PRs automáticamente
- Reglas de estilo con `.commitpilotrc`

## 📋 Comandos útiles
```bash
cd ~/dev/commitpilot
npm test                  # correr tests
git log --oneline         # ver historial
gh run list               # ver estado del CI
battctl status            # monitor de batería (sigue activo)
```
