# Sistema de Pedidos de Esencias (Versión con Servidor Compartido)

App web para que tus clientes realicen pedidos de artículos con aromas. Los cambios que haga el administrador se ven **inmediatamente** para todos los clientes (sin necesidad de mandar JSON).

## Características
- **Admin** (protegido con clave): cargar/editar artículos y aromas, configurar WhatsApp, ver pedidos recibidos.
- **Clientes**: hacer pedidos con cantidades por aroma, ver detalle + resumen agrupado, datos personales guardados, generar PDF y enviar por WhatsApp, historial local.
- Datos compartidos en tiempo real vía servidor.

## Contraseña inicial de Admin
**admin123** (cambiala desde el panel)

## Desplegar gratis en Render.com (recomendado)

1. Entrá a https://render.com y creá una cuenta (con GitHub).
2. New → Web Service.
3. Conectá este repositorio: `makialertas/pedidos-esencias`
4. Configuración:
   - **Name**: pedidos-esencias (o el que quieras)
   - **Region**: el más cercano
   - **Branch**: main
   - **Root Directory**: (dejar vacío o `/`)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
5. Create Web Service.

En unos minutos te da un link público tipo:  
`https://pedidos-esencias.onrender.com`

Ese link se lo mandás a tus clientes.

**Nota**: En el plan Free de Render el servidor se "duerme" después de un rato de inactividad y tarda ~30 segundos en despertar la primera vez. Los datos se mantienen mientras el servicio esté activo.

## Correr en local
```bash
npm install
npm start
```
Abrí http://localhost:3000

## Estructura
- `server.js` → backend
- `public/` → frontend (clientes + admin)
- `data/db.json` → base de datos (artículos, settings, pedidos)

¡Listo para usar con todos tus clientes!
