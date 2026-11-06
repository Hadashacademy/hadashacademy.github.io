# Sunny con IA (OpenAI) · Study Island

Sunny funciona en dos modos:

- **Con IA (OpenAI):** conversación libre, como una llamada.
- **Gratis (práctica guiada):** preguntas por nivel con el micrófono de Chrome.

Si la IA falla o se acaba el saldo, Study Island pasa sola al modo gratis. El estudiante no tiene que hacer nada.

## Activar la IA (una sola vez)

1. **Clave de OpenAI:** entra a platform.openai.com → *Billing* → agrega saldo (por ejemplo US$5) → *API keys* → *Create new secret key*. Copia la clave (empieza con `sk-`). No la pongas nunca en la página web.
2. **Puente en Cloudflare (gratis):** entra a dash.cloudflare.com → *Workers & Pages* → *Create* → *Worker* → nombre `hadash-sunny` → *Deploy* → *Edit code* → borra todo, pega el contenido de `worker.js` → *Deploy*.
3. En el Worker → *Settings* → *Variables and Secrets*, agrega:
   - `OPENAI_KEY` (tipo **Secret**): tu clave `sk-...`
   - `ALLOWED_ORIGIN` (Text): `https://hadashacademy.github.io`
   - Opcional: `ACCESS_CODES` (códigos de tus estudiantes, separados por coma) y `DAILY_LIMIT`.
4. Copia la dirección del Worker (algo como `https://hadash-sunny.TU-USUARIO.workers.dev`) y ponla en `study-island/sunny.js`:
   `window.SUNNY_URL = 'https://hadash-sunny.TU-USUARIO.workers.dev';`

## Costo aproximado
Con el modelo `gpt-4.1-mini`, una conversación de unos 20 turnos cuesta alrededor de 1 a 2 centavos de dólar. Con US$5 alcanza para varios cientos de conversaciones. En OpenAI puedes poner un límite de gasto mensual (*Billing → Limits*).
