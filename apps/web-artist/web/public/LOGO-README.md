# 📁 Ubicación del Logo de Piúms

## Archivos Necesarios

Coloca tus archivos de logo en este directorio (`/public/`):

```
/Users/piums/Desktop/piums-platform/apps/web/web/public/
  ├── logo.jpg              ← Logo principal (fondo claro)
  ├── logo-white.png        ← Logo blanco (para footer oscuro)
  └── favicon.ico           ← Favicon para navegador (opcional)
```

## ✅ Implementación Completada

El logo ya está integrado en los siguientes lugares:

### 1. **Navbar** (`/src/components/Navbar.tsx`)
- Logo principal en esquina superior izquierda
- Dimensiones: 120x40px
- Enlace a `/dashboard`

### 2. **Footer** (`/src/components/Footer.tsx`)
- Logo blanco en la primera columna
- Dimensiones: 100x35px

### 3. **Página de Login** (`/src/app/login/page.tsx`)
- Logo centrado arriba del formulario
- Dimensiones: 150x50px

### 4. **Página de Registro** (`/src/app/register/page.tsx`)
- Logo centrado arriba del formulario
- Dimensiones: 150x50px

### 5. **Meta Tags** (`/src/app/layout.tsx`)
- Theme color actualizado a `#FF6A00` (naranja oficial de Piúms)

## 🎨 Colores Oficiales Implementados

Los colores ya están definidos en `/src/app/globals.css`:

```css
--color-primary: #FF6A00;        /* Naranja - Color principal */
--color-primary-dark: #E65F00;   /* Naranja oscuro (hover) */
--color-primary-light: #FF8533;  /* Naranja claro (backgrounds) */
--color-accent: #00AEEF;         /* Azul - Acento (punto de la í) */
--color-accent-dark: #009DD6;    /* Azul oscuro (hover) */
--color-accent-light: #33BDFF;   /* Azul claro (backgrounds) */
```

## 📝 Uso en Tailwind

```tsx
// Color primario (naranja)
className="bg-[#FF6A00] text-white"
className="text-[#FF6A00]"
className="bg-[#FF6A00]/10" // 10% opacidad

// Color acento (azul)
className="text-[#00AEEF]"
className="border-[#00AEEF]"

// Hover states
className="hover:bg-[#E65F00]" // Naranja oscuro
className="hover:text-[#009DD6]" // Azul oscuro
```

## 🖼️ Formatos Recomendados

- **logo.jpg**: Fondo transparente o blanco, formato JPG/PNG
- **logo-white.png**: PNG con transparencia, logo en blanco
- **Resolución mínima**: 300x100px para calidad HD
- **Resolución recomendada**: 600x200px

## 🔧 Próximos Pasos

Si necesitas cambiar el logo:
1. Reemplaza los archivos en `/public/`
2. Mantén los mismos nombres (`logo.jpg`, `logo-white.png`)
3. El cambio se reflejará automáticamente (sin editar código)

---

**Última actualización**: 2 de marzo de 2026
**Implementado por**: GitHub Copilot
