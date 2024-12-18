// injected.js (Runs in Page Context)
console.log("Injected script (page context) loaded.");

(function overrideFetch() {
  const originalFetch = window.fetch;

  if (!originalFetch) {
    console.error("Fetch unavailable in page context.");
    return;
  }

  let currentUserMessage = null;
  let currentConvId = null;

  async function finalizeAssistantResponse(assistantResponse) {
    // Post data to content scripts
    window.postMessage({
      type: 'FINALIZE_ASSISTANT',
      data: {
        assistantResponse,
        convId: currentConvId,
        userMessage: currentUserMessage
      }
    }, '*');
  }

  window.fetch = async (...args) => {
    const [resource, options] = args;
    if (options && options.method === "POST" && resource.includes("/conversation")) {
      const body = JSON.parse(options.body || "{}");
      currentUserMessage = body.messages?.find((m) => m.author.role === "user")?.content?.parts?.join("") || null;
      currentConvId = body.conversation_id || null;

      console.log("Fetch intercepted:", { currentUserMessage, currentConvId });

      const response = await originalFetch(...args);
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let assistantParts = [];
      let isDone = false;

      const modifiedStream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            // Always finalize the assistant response if not already processed
            if (!isDone && assistantParts.length > 0) {
              console.log("Finalizing assistant response with remaining parts.");
              await finalizeAssistantResponse(assistantParts.join(""));
            }
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });

          // The streamed data usually comes in lines starting with 'data: ...'
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
          for (const line of lines) {
            const jsonLine = line.replace(/^data:\s*/, '');
            if (jsonLine === "[DONE]") {
              // Process and finalize when receiving [DONE]
              isDone = true;
              await finalizeAssistantResponse(assistantParts.join(""));
              controller.close();
              return;
            }

            try {
              const jsonObj = JSON.parse(jsonLine);
              if (jsonObj.v) {
                if (typeof jsonObj.v === "string") {
                  assistantParts.push(jsonObj.v);
                } else if (typeof jsonObj.v === "object") {
                  if (jsonObj.v.message && jsonObj.v.message.author && jsonObj.v.message.author.role === "assistant") {
                    if (jsonObj.v.message.content) {
                      if (jsonObj.v.message.content.content_type === "code") {
                        assistantParts.push("<code>" + jsonObj.v.message.content.text);
                      } else if (jsonObj.v.message.content.parts) {
                        assistantParts.push(jsonObj.v.message.content.parts.join(""));
                      }
                    }
                  } else if (jsonObj.v.message && jsonObj.v.message.author && jsonObj.v.message.author.role === "tool") {
                    if (jsonObj.v.message.content) {
                      if (jsonObj.v.message.content.content_type === "execution_output") {
                        assistantParts.push("</code><result>" + jsonObj.v.message.content.text);
                      }
                      if (jsonObj.v.message.status === "finished_successfully") {
                        assistantParts.push("</result>");
                      }
                    }
                  } else if (Array.isArray(jsonObj.v) && jsonObj.v.length > 0) {
                    for (const part of jsonObj.v) {
                      if (part.p && (part.p === "/message/content/parts/0" || part.p === "/message/content/text")) {
                        assistantParts.push(part.v);
                      }
                      if (part.p && part.p === "/message/metadata/aggregate_result/final_expression_output") {
                        assistantParts.push("</result>");
                      }
                    }
                  }
                }
              }
            } catch (error) {
              // Ignore invalid JSON lines
            }
          }

          controller.enqueue(value);
        },
      });

      return new Response(modifiedStream, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    } else {
      return originalFetch(...args);
    }
  };

  console.log("Fetch successfully overridden in page context.");
})();