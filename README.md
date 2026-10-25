# ✈️ CommitPilot

**IA para tus commits, changelogs y Pull Requests — directamente desde la terminal.**

CommitPilot lee tu `git diff` y usa modelos de IA (vía [OpenRouter](https://openrouter.ai)) para escribir
mensajes de commit claros, changelogs ordenados y descripciones de PR listas para pegar.

> **Open-source y BYOK (Bring Your Own Key):** tú pones tu propia API key de OpenRouter.
> Nadie más paga por tu uso y tu clave nunca sale de tu máquina.

---

## ✨ Características

- 🧠 **Mensajes de commit** con formato [Conventional Commits](https://www.conventionalcommits.org/) y 3 alternativas.
- 📜 **Changelogs** agrupados automáticamente (Keep a Changelog).
- 🔀 **Descripciones de Pull Request** con Resumen, Cambios y Cómo probar.
- 🪝 **Git hook** opcional (`prepare-commit-msg`) para sugerir el mensaje al commitear.
- 🌎 Salida en **español o inglés**.
- 🔌 **Sin dependencias externas** (Node ≥18, usa `fetch` nativo).
- 🧩 Funciona con **cualquier modelo de OpenRouter** (DeepSeek, Llama, Claude, GPT, etc.).

---

## 🚀 Instalación

```bash
# Opción 1: desde npm (cuando esté publicado)
npm install -g commitpilot

# Opción 2: desde el repositorio
git clone https://github.com/juanpablofuentealba/commitpilot.git
cd commitpilot
npm link
```

### Configura tu clave (BYOK)

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

Consíguela (tiene plan gratuito) en <https://openrouter.ai/keys>.

Añádela a tu `~/.bashrc` o `~/.zshrc` para que persista:

```bash
echo 'export OPENROUTER_API_KEY="sk-or-..."' >> ~/.bashrc
```

---

## 🧑💻 Uso

### Mensaje de commit

```bash
git add .
commitpilot commit
```

Salida:

```
Propuestas de mensaje de commit (deepseek/deepseek-chat-v3-0324 [tokens: 512]):

  1. feat(auth): añade inicio de sesión con Google
  2. feat: integra OAuth de Google en el login
  3. feat(auth): soporta proveedor Google en autenticación
```

Crear el commit directamente con la primera propuesta:

```bash
commitpilot commit --apply --yes
```

### Changelog

```bash
commitpilot changelog --range v0.1.0..HEAD > CHANGELOG.md
```

### Descripción de Pull Request

```bash
commitpilot pr --base main > pr.md
```

### Git hook automático

```bash
commitpilot install-hook
```

A partir de ahí, al hacer `git commit` sin mensaje, CommitPilot propondrá uno.

---

## ⚙️ Opciones

| Opción | Descripción |
| --- | --- |
| `--model <id>` | Modelo de OpenRouter (por defecto `deepseek/deepseek-chat-v3-0324`) |
| `--lang <es\|en>` | Idioma de salida |
| `--no-conventional` | Sin prefijos `feat:`/`fix:` |
| `--hint "..."` | Contexto extra para la IA |
| `--range <a..b>` | Rango de commits (changelog) |
| `--base <rama>` | Rama base para el PR |
| `--json` | Salida JSON (scripts/CI) |
| `--apply` | (commit) Ejecuta el commit con la primera propuesta |
| `--yes` | Confirma sin preguntar (con `--apply`) |

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `OPENROUTER_API_KEY` | **Obligatoria.** Tu clave de OpenRouter. |
| `COMMITPILOT_API_KEY` | Alternativa a la anterior. |
| `COMMITPILOT_MODEL` | Modelo por defecto. |

---

## 📚 Uso como librería

```js
import { generateCommitMessages } from "commitpilot";

const diff = `diff --git a/index.js b/index.js ...`;
const { messages, usage } = await generateCommitMessages(diff, {
  apiKey: process.env.OPENROUTER_API_KEY,
  locale: "es",
});
console.log(messages);
```

---

## 🔐 Privacidad

- CommitPilot **no envía telemetría**.
- Solo se transmite a OpenRouter el **diff** (truncado a 12 000 caracteres) y tus metadatos de prompt.
- Tu API key se lee del entorno y **nunca** se escribe en disco ni en el repositorio.

---

## 🧪 Desarrollo

```bash
npm test          # tests unitarios (sin red)
npm run lint      # comprobación de sintaxis
```

---

## 🗺️ Roadmap

- [ ] Soporte para más proveedores (OpenAI, Anthropic directo).
- [ ] Reglas de estilo configurables (`.commitpilotrc`).
- [ ] Detección de breaking changes.
- [ ] Acción de GitHub para comentar PRs automáticamente.
- [ ] Modo "sin IA" con plantillas (offline).

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Abre un issue o un PR. Revisa primero el código y ejecuta `npm test`.

## 📄 Licencia

[MIT](./LICENSE) © juanpablofuentealba
