#!/data/data/com.termux/files/usr/bin/bash
# deploy.sh - Despliega la landing de CommitPilot en Netlify.
set -e
cd "$(dirname "$0")"

echo "==> 1. Comprobar login de Netlify"
if ! netlify status 2>&1 | grep -q "Current project"; then
  echo "No estás logueado o no hay sitio enlazado."
  echo ""
  echo "Ejecuta primero:"
  echo "  netlify login"
  echo "  netlify init --manual        # o: netlify sites:create --name commitpilot"
  echo ""
  echo "Después vuelve a ejecutar: ./deploy.sh"
  exit 1
fi

echo "==> 2. Deploy de producción"
netlify deploy --prod --dir=site

echo ""
echo "✅ Listo. Revisa la URL que muestra arriba."
