const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        handleSend(\`Me interesa el \${selectedVehicle.year} \${selectedVehicle.make} \${selectedVehicle.model}. Cuéntame más detalles sobre este vehículo desde el inventario: su motor, transmisión, millas por galón, caballaje y lo que lo hace destacar.\`);
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                        setActiveTab('chat');
                      }
                    }}`;

const replacement = `                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        const msgText = \`¡Hola! Soy tu asistente virtual de GT Auto Imports. Veo que estás interesado en el **\${selectedVehicle.year} \${selectedVehicle.make} \${selectedVehicle.model}**. ¿En qué te puedo ayudar? Puedo darte más detalles sobre el motor, transmisión, opciones de financiamiento o coordinar una cita.\`;
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
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                        setActiveTab('chat');
                      }
                    }}`;

const targetStr2 = `                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        handleSend(\`Me interesa el \${selectedVehicle.year} \${selectedVehicle.make} \${selectedVehicle.model}. ¿Tienen alguna oferta especial o un pagaré estimado? Me gustaría saber más sobre el proceso de financiamiento y pre-cualificar.\`);
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                        setActiveTab('chat');
                      }
                    }}`;

const replacement2 = `                  <button 
                    onClick={() => {
                      if (selectedVehicle) {
                        const msgText = \`¡Hola! Soy tu asistente virtual de GT Auto Imports. Veo que estás interesado en el **\${selectedVehicle.year} \${selectedVehicle.make} \${selectedVehicle.model}** y en sus opciones de financiamiento. ¿Te gustaría pre-cualificar sin indagación de crédito o tienes alguna duda sobre el proceso?\`;
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
                        setSelectedImage(null);
                        setSelectedVehicle(null);
                        setActiveTab('chat');
                      }
                    }}`;

if (code.includes(targetStr) && code.includes(targetStr2)) {
  code = code.replace(targetStr, replacement);
  code = code.replace(targetStr2, replacement2);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found!");
}
