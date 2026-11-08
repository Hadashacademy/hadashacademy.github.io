# Sunny con IA (Azure OpenAI) · Study Island

Sunny funciona en dos modos:

- **Con IA (Azure OpenAI, modelo gpt-4.1-mini):** conversación libre, como una llamada. Cada estudiante necesita su **código personal de Sunny**.
- **Gratis (práctica guiada):** preguntas por nivel con el micrófono de Chrome. No necesita código.

Si la IA falla, se acaba el crédito o el código no es válido, Study Island pasa sola al modo gratis.

## Cómo está montado

- **Cerebro:** Microsoft Foundry (ai.azure.com), recurso `mercedes-moronta22-1910-resource`, despliegue `gpt-4.1-mini`.
- **Puente:** Cloudflare Worker `hadash-sunny` → https://hadash-sunny.dream-inenglish25.workers.dev/ (código en `worker.js`).
- **Página:** `study-island/sunny.js` tiene la dirección del puente.

Secretos en Cloudflare (Worker → Settings → Variables and Secrets):
- `AZURE_KEY` (Secret): la API key de Foundry. Nunca va en la página web.
- `STUDENT_CODES` (Secret): códigos de los estudiantes separados por coma.

## Estudiantes
- **Desactivar a uno:** edita `STUDENT_CODES`, borra su código y su coma → Deploy.
- **Agregar uno:** agrega `,HADASH-XXXXX` al final → Deploy.
- El estudiante escribe su código una sola vez en *Conversación con Sunny*.

## Costo
Con `gpt-4.1-mini`, una conversación de unos 20 turnos cuesta alrededor de 1 a 2 centavos de dólar. Pon un presupuesto en el portal de Azure (Cost Management → Budgets).
