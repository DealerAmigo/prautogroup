const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    onChatClick={(vehicle) => {
                      handleSend(\`Me interesa el \${vehicle.year} \${vehicle.make} \${vehicle.model}. Cuéntame más detalles sobre este vehículo desde el inventario: su motor, transmisión, millas por galón, caballaje y lo que lo hace destacar.\`);
                      setActiveTab('chat');
                    }}
                    onFinanceClick={(vehicle, estimatedPayment) => {
                      handleSend(\`Me interesa el \${vehicle.year} \${vehicle.make} \${vehicle.model}. ¿Tienen alguna oferta especial o un pagaré estimado de $\${estimatedPayment}/mo? Me gustaría saber más sobre el proceso de financiamiento y pre-cualificar para pasárselo al vendedor.\`);
                      setActiveTab('chat');
                    }}`;

const replacement = `                    onChatClick={(vehicle) => {
                      const msgText = \`¡Hola! Soy tu asistente virtual de GT Auto Imports. Veo que estás interesado en el **\${vehicle.year} \${vehicle.make} \${vehicle.model}**. ¿En qué te puedo ayudar? Puedo darte más detalles sobre el motor, transmisión, opciones de financiamiento o coordinar una cita.\`;
                      const newAssistantMessage = {
                        id: Date.now().toString(),
                        role: 'assistant' as const,
                        content: msgText,
                        timestamp: Date.now()
                      };
                      setMessages(prev => [...prev, newAssistantMessage]);
                      if (chatRef.current) {
                        chatRef.current.history.push({ role: 'model', parts: [{ text: msgText }] });
                      }
                      setActiveTab('chat');
                    }}
                    onFinanceClick={(vehicle, estimatedPayment) => {
                      const msgText = \`¡Hola! Soy tu asistente virtual de GT Auto Imports. Veo que estás interesado en el **\${vehicle.year} \${vehicle.make} \${vehicle.model}** y sus opciones de financiamiento (estimado $\${estimatedPayment}/mo). ¿Te gustaría pre-cualificar sin indagación de crédito o tienes alguna duda sobre el proceso?\`;
                      const newAssistantMessage = {
                        id: Date.now().toString(),
                        role: 'assistant' as const,
                        content: msgText,
                        timestamp: Date.now()
                      };
                      setMessages(prev => [...prev, newAssistantMessage]);
                      if (chatRef.current) {
                        chatRef.current.history.push({ role: 'model', parts: [{ text: msgText }] });
                      }
                      setActiveTab('chat');
                    }}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found!");
}
