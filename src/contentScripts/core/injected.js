console.log('FeedWizard enabled - Sampler Only')

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const [resource, options] = args;
  const method = options.method;

  // Only intercept POST requests to the conversation endpoints
  if (method === 'POST' && (resource.includes('backend-anon/conversation') || resource.includes('backend-api/conversation'))) {
    // Parse the request body to extract the user message
    const newBody = JSON.parse(options.body);
    console.log('newBody', newBody)

    // Extract the user's message (assuming the last message with role 'user')
    let userMessage = "";
    if (newBody.messages && Array.isArray(newBody.messages)) {
      const userMsgObj = newBody.messages.find(msg => msg.author.role === 'user');
      if (userMsgObj && userMsgObj.content) {
        userMessage = userMsgObj.content.parts.join('');
      }
    }

    // We'll print the USER message immediately
    if (userMessage) {
      console.log("USER MESSAGE:", userMessage);
    }

    // Proceed with the original fetch to get the assistant's streaming response
    const response = await originalFetch(resource, options);
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    // We'll accumulate assistant parts as they stream in
    let assistantParts = [];

    const modifiedStream = new ReadableStream({
      async pull(controller) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        // Decode the current chunk
        const chunk = decoder.decode(value, { stream: true });

        console.log('chunk', chunk)

        // The streamed data usually comes in lines starting with 'data: ...'
        // We attempt to parse each line and extract assistant parts if present.
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
        for (const line of lines) {
          const jsonLine = line.replace(/^data:\s*/, '');
          try {
            const jsonObj = JSON.parse(jsonLine);
            if (jsonObj.v) {
              if (typeof jsonObj.v === 'string') {
                assistantParts.push(jsonObj.v);
              } else if (typeof jsonObj.v === 'object') {
                if (jsonObj.v.message && jsonObj.v.message.author && jsonObj.v.message.author.role === 'assistant') {
                  if (jsonObj.v.message.content) {
                    if (jsonObj.v.message.content.content_type === 'code') {
                      assistantParts.push('<code>' + jsonObj.v.message.content.text);
                    } else if (jsonObj.v.message.content.parts) {
                      assistantParts.push(jsonObj.v.message.content.parts.join(''));
                    }
                  }
                } else if (jsonObj.v.message && jsonObj.v.message.author && jsonObj.v.message.author.role === 'tool') {
                  if (jsonObj.v.message.content) {
                    if (jsonObj.v.message.content.content_type === 'execution_output') {
                      assistantParts.push('</code><result>' + jsonObj.v.message.content.text);
                    }
                    if (jsonObj.v.message.status === 'finished_successfully') {
                      assistantParts.push('</result>');
                    }
                  }
                } else if (jsonObj.v.length > 0) {
                  for (const part of jsonObj.v) {
                    if (part.p && (part.p === '/message/content/parts/0' || part.p === '/message/content/text')) {
                      assistantParts.push(part.v);
                    }
                    if (part.p && part.p === '/message/metadata/aggregate_result/final_expression_output') {
                      assistantParts.push('</result>');
                    }
                  }
                }
              }
              console.log('assistantParts', assistantParts);
            }
          } catch (error) {
            // If parsing fails, we ignore that line
            if (jsonLine === '[DONE]') {
              // Streaming done - print the full assistant response
              const assistantResponse = assistantParts.join('');
              console.log("ASSISTANT RESPONSE:", assistantResponse);
            }
          }
        }

        // We still need to pass the data through
        controller.enqueue(value);
      },
      cancel() {
        reader.cancel();
      }
    });

    return new Response(modifiedStream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }
  else {
    // For other requests, do nothing special
    return originalFetch(...args);
  }
};