# 🚀 Guía Completa: Notificaciones Push y Actualización Automática del Widget

Esta guía detalla cómo funciona la actualización en segundo plano de los widgets de **PixelDraw** y los pasos necesarios para configurar Firebase (100% gratuito, sin necesidad de cuenta de Google Play).

---

## 💡 ¿Cómo resuelve esto el problema de hibernación en Render?

1. **El servidor ya está despierto al dibujar:** Cuando tu pareja termina un dibujo y pulsa "Enviar", su app hace una petición al backend de Render. Por lo tanto, en ese preciso instante, **Render está 100% activo y despierto**.
2. **Envío inmediato de Push:** El backend toma el token de tu dispositivo y envía una notificación push a través del servicio gratuito de Expo (`https://exp.host/--/api/v2/push/send`).
3. **Actualización en segundo plano (Headless Task):** Tu teléfono recibe la notificación en segundo plano y ejecuta la tarea `PIXELDRAW_BACKGROUND_NOTIFICATION_TASK` definida en `src/services/notifications.ts`, actualizando el Widget al instante sin que tengas que abrir la app.
4. **Respaldo periódico:** Además, se habilitó la actualización periódica en Android cada 30 minutos (`updatePeriodMillis: 1800000`). Si el widget se actualiza por sistema y Render está despierto, consultará la API y actualizará el lienzo automáticamente.

---

## 🛠️ Paso 1: Configurar Firebase (Android - 100% Gratuito)

> ⚠️ **No necesitas pagar la licencia de desarrollador de Google ($25)** ni publicar en la Play Store. Firebase Cloud Messaging (FCM) es un servicio gratuito.

1. Ve a la consola de [Google Firebase](https://console.firebase.google.com/).
2. Haz clic en **"Crear un proyecto"** (o usa uno existente) y asígnale un nombre (ej. `pixeldraw-app`).
3. En la pantalla principal del proyecto, haz clic en el ícono de **Android** para registrar tu aplicación:
   - **Nombre de paquete de Android:** `com.brahiancx.pixeldraw` *(debe coincidir exactamente con el de `app.json`)*.
   - **Apodo:** `PixelDraw`.
4. Descarga el archivo **`google-services.json`**.
5. Coloca el archivo descargado en la raíz de la carpeta `frontend/`:
   ```
   frontend/
   ├── google-services.json   <-- AQUÍ
   ├── app.json
   ├── package.json
   ...
   ```
6. En [app.json](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/app.json), agrega la referencia al archivo dentro del bloque `"android"`:
   ```json
   "android": {
     "package": "com.brahiancx.pixeldraw",
     "googleServicesFile": "./google-services.json",
     ...
   }
   ```

---

## 🔑 Paso 2: Generar Credenciales FCM v1 para Expo

Google ahora utiliza la API FCM HTTP v1:

1. En la consola de Firebase, ve al ícono de engranaje ⚙️ > **Configuración del proyecto** > pestaña **Cuentas de servicio (Service Accounts)**.
2. Haz clic en **"Generar nueva clave privada"** y confirma. Se descargará un archivo JSON con tus credenciales.
3. Abre tu terminal en `frontend/` y sube las credenciales a Expo ejecutando:
   ```bash
   npx eas credentials
   ```
4. Sigue las instrucciones interactivas:
   - Selecciona **Android**.
   - Selecciona **Push Notifications** (o FCM V1 Service Account).
   - Proporciona la ruta al archivo JSON de la clave privada que descargaste de Firebase.

---

## 💻 Paso 3: Código ya implementado en el Frontend

Ya se realizaron todas las integraciones en el cliente:

1. **Instalación de paquetes:**
   - `expo-notifications`: Manejo de permisos, tokens y notificaciones.
   - `expo-task-manager`: Tareas en segundo plano cuando la app está cerrada.

2. **Servicio de Notificaciones (`src/services/notifications.ts`):**
   - Canal de alta prioridad para Android (`pixeldraw-drawings`).
   - `registerForPushNotificationsAsync`: Solicita permisos y envía el token a la base de datos.
   - Tarea en segundo plano `PIXELDRAW_BACKGROUND_NOTIFICATION_TASK`: Recibe el dibujo y refresca el widget de inmediato.
   - Listeners de primer plano y navegación al tocar la notificación.

3. **Ciclo de vida (`_layout.tsx` y `auth-context.tsx`):**
   - Registro automático del token push tras iniciar sesión.
   - Manejo de clics en notificaciones para abrir la aplicación.

4. **Widget de Android (`src/services/widget-task-handler.tsx`):**
   - Intervalo configurado a 30 minutos (`1800000 ms`).
   - Consulta a la API en segundo plano durante `WIDGET_UPDATE`.

---

## 🌐 Paso 4: Cambios en el Backend (Render)

Para que el backend envíe la notificación al crear un nuevo dibujo, realiza estos dos sencillos pasos en tu carpeta `backend/`:

### 1. Agregar `pushToken` al modelo `User` en `prisma/schema.prisma`:
```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  email     String   @unique
  coupleId  Int?
  pushToken String?  // <--- AGREGAR ESTA LÍNEA
  couple    Couple?  @relation(fields: [coupleId], references: [id])
  ...
}
```
Ejecuta la migración:
```bash
npx prisma db push
```

### 2. Enviar notificación Push al crear dibujo en `artwork.service.ts`:
En `backend/src/services/artwork.service.ts`, dentro del método `createArtwork`:

```ts
// Después de crear el artwork en Prisma:
const artwork = await prisma.artwork.create({ ... });

// Buscar a la pareja para enviarle la notificación push
const partner = await prisma.user.findFirst({
  where: {
    coupleId: data.coupleId,
    id: { not: data.authorId },
  },
  select: { pushToken: true },
});

if (partner?.pushToken) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: partner.pushToken,
        sound: 'default',
        title: 'Nuevo dibujo ❤️',
        body: `${author.username} te ha enviado un nuevo dibujo`,
        // Enviar datos para que el widget se actualice directamente:
        data: {
          type: 'NEW_DRAWING',
          artwork: artwork,
        },
      }),
    });
  } catch (pushErr) {
    console.warn('[PushNotification Error]:', pushErr);
  }
}

return artwork as ArtworkWithAuthor;
```

---

## ⚡ Paso 5: Evitar la Hibernación de Render (Keep-Alive Cron)

Para evitar por completo los 50 segundos de espera cuando el servidor se duerme:

1. Ve a [cron-job.org](https://cron-job.org) o [UptimeRobot](https://uptimerobot.com) (ambos son 100% gratuitos).
2. Crea un nuevo cron job o monitor HTTP apuntando a tu endpoint de salud:
   ```
   URL: https://pixel-draw-backend-dce0.onrender.com/api/v1/health
   Método: GET
   Intervalo: Cada 10 minutos
   ```
3. **Resultado:** Render nunca entrará en modo de hibernación. Cualquier petición o actualización responderá en menos de 250ms.

---

## 📱 Paso 6: Compilar y Probar en Teléfonos Físicos

Para probar las notificaciones push en Android sin Play Store:

1. Agrega el perfil de compilación de APK directa en [eas.json](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/eas.json):
   ```json
   "preview": {
     "distribution": "internal",
     "android": {
       "buildType": "apk"
     }
   }
   ```
2. Compila el archivo `.apk` ejecutable:
   ```bash
   npx eas build -p android --profile preview
   ```
3. Descarga e instala el `.apk` en ambos teléfonos.
4. Inicia sesión en ambas cuentas.
5. ¡Envía un dibujo desde un teléfono y observa cómo el widget del otro teléfono se actualiza de inmediato!
