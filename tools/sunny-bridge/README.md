# Sunny con IA (Azure OpenAI) · Study Island

Sunny funciona en dos modos:

- **Con IA (Azure OpenAI, modelo gpt-4.1-mini):** conversación libre, como una llamada, en Study Island y en el English Lab (botón ☀️ *Talk with Sunny*, niveles A1 a C1). Cada estudiante usa su **código personal** (HADASH-E202501 … HADASH-E202515), que también abre Study Island.
- **Gratis (práctica guiada):** preguntas por nivel con el micrófono de Chrome. No necesita código.

Si la IA falla, se acaba el crédito o el código no es válido, Study Island pasa sola al modo gratis.

## Cómo está montado

- **Cerebro:** Microsoft Foundry (ai.azure.com), recurso `mercedes-moronta22-1910-resource`, despliegue `gpt-4.1-mini`.
- **Puente:** Cloudflare Worker `hadash-sunny` → https://hadash-sunny.dream-inenglish25.workers.dev/ (código en `worker.js`).
- **Página:** `study-island/sunny.js` tiene la dirección del puente.

Secretos en Cloudflare (Worker → Settings → Variables and Secrets):
- `AZURE_KEY` (Secret): la API key de Foundry. Nunca va en la página web.
- `STUDENT_CODES` (Secret): códigos de los estudiantes separados por coma.
- `CLASS_CODE` (Secret): el código de la clase de Study Island, para que el código personal también abra las lecciones.

## Estudiantes
- **Desactivar a uno:** edita `STUDENT_CODES`, borra su código y su coma → Deploy.
- **Agregar uno:** agrega `,HADASH-E202516` (siguiente número) al final → Deploy.
- El estudiante escribe su código una sola vez en *Conversación con Sunny*.

## Costo
Con `gpt-4.1-mini`, una conversación de unos 20 turnos cuesta alrededor de 1 a 2 centavos de dólar. Pon un presupuesto en el portal de Azure (Cost Management → Budgets).
