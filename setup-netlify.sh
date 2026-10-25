#!/data/data/com.termux/files/usr/bin/bash
# setup-netlify.sh - Configura y despliega la landing de CommitPilot en Netlify.
# Ejecutar DESPUÉS de tener una cuenta en netlify.com.
set -e
cd "$(dirname "$0")"

echo "=========================================="
echo "  CommitPilot — Setup de Netlify"
echo "=========================================="
echo ""

# 1. Login (abre el navegador)
if ! netlify status 2>&1 | grep -q "Logged in"; then
  echo "==> Paso 1/4: Iniciar sesión en Netlify"
  echo "    Se abrirá el navegador. Autoriza el acceso."
  netlify login
else
  echo "==> Paso 1/4: Ya estás logueado en Netlify ✓"
fi

# 2. Crear/enlazar sitio
if ! [ -f .netlify/state.json ]; then
  echo ""
  echo "==> Paso 2/4: Creando sitio 'commitpilot'"
  netlify sites:create --name commitpilot 2>/dev/null || \
    echo "    (El nombre 'commitpilot' puede estar ocupado; Netlify asignará otro)"
  netlify link --name commitpilot 2>/dev/null || netlify link
else
  echo ""
  echo "==> Paso 2/4: Sitio ya enlazado ✓"
fi

# 3. Deploy de producción
echo ""
echo "==> Paso 3/4: Desplegando a producción"
netlify deploy --prod --dir=site

# 4. Resumen
echo ""
echo "==> Paso 4/4: ¡Listo!"
echo ""
netlify status 2>&1 | grep -iE "url|site|admin" | head -5
echo ""
echo "✅ Tu landing está publicada."
echo "   Copia la URL mostrada arriba."
