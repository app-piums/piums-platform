# Endpoint: Subida de Avatar

**Método:** POST
**Ruta:** /api/users/me/avatar
**Autenticación:** Requerida (Bearer Token)
**Payload:** multipart/form-data

## Parámetros
- `avatar`: archivo de imagen (jpeg, png, webp)

## Respuesta
- 200 OK
```json
{
  "avatarUrl": "https://cdn.piums.com/avatars/user_123.jpg"
}
```
- 400 Bad Request (archivo inválido)
- 401 Unauthorized (sin token)
- 500 Internal Server Error (error de almacenamiento)

## Lógica
- Validar tipo y tamaño del archivo.
- Almacenar imagen en carpeta local o bucket cloud.
- Actualizar campo `avatar` en el usuario.
- Eliminar avatar anterior si existe.

## Ejemplo de uso (curl)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/ruta/a/imagen.jpg" \
  https://api.piums.com/api/users/me/avatar
```

## Notas
- Solo el usuario autenticado puede subir/reemplazar su avatar.
- El endpoint puede extenderse para artistas: `/api/artists/me/avatar`.
