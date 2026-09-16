# PixelDraw - Frontend (Expo & Tamagui)

Aplicación universal (Móvil & Web) para compartir dibujos en pareja en tiempo real con pixel art interactivo.

## 📱 Tecnologías

- **Framework:** [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **UI Kit:** [Tamagui](https://tamagui.dev) + Lucide Icons
- **Lenguaje:** TypeScript
- **Web Support:** `@expo/metro-runtime` & `react-native-web`
- **Almacenamiento Universal:** `expo-secure-store` (móvil) con fallback a `localStorage` (web)

## 🚀 Comandos Rápidos

```bash
# Instalar dependencias
npm install

# Iniciar en el Navegador Web
npm run web

# Iniciar en Android (Emulador o dispositivo físico)
npm run android

# Iniciar en iOS (Simulador Mac)
npm run ios

# Verificar TypeScript
npx tsc --noEmit
```

## ⚙️ Configuración de Entorno

Por defecto, la app apunta al backend en producción alojado en Render:
- Backend URL: `https://pixel-draw-backend-dce0.onrender.com/api/v1`

Si deseas usar un servidor local u otro entorno, puedes sobrescribirlo creando un archivo `.env` o `.env.local` en la raíz de `frontend/`:
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## 🎨 Pantallas y Rutas

- `/` ([src/app/index.tsx](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/src/app/index.tsx)): Dashboard principal con el último dibujo activo de la pareja y accesos rápidos.
- `/auth` ([src/app/auth.tsx](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/src/app/auth.tsx)): Iniciar sesión y registro de cuenta.
- `/draw` ([src/app/draw.tsx](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/src/app/draw.tsx)): Estudio de Pixel Art interactivo (pincel, borrador, cubo de pintura, cuentagotas, deshacer y envío directo).
- `/gallery` ([src/app/gallery.tsx](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/src/app/gallery.tsx)): Galería histórica con zoom modal y detalles.
- `/couple` ([src/app/couple.tsx](file:///C:/Users/Usuario/Documents/proyectos/pixeldraw/frontend/src/app/couple.tsx)): Vinculación de pareja con código de invitación (`PX-XXXXXX`), datos de pareja y desvinculación.
