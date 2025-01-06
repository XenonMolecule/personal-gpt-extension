// bridge.js (Content Script)
const _browser = (typeof browser !== 'undefined') ? browser : chrome;

console.log("Bridge script running, ready to relay messages.");

// Listen to messages from the page context
window.addEventListener("message", async (event) => {
  if (event.source !== window || !event.data?.type) return;

  if (event.data.type === 'FINALIZE_ASSISTANT') {
    const { assistantResponse, convId, userMessage } = event.data.data;
    console.log("Bridge received assistant data:", { assistantResponse, convId, userMessage });

    // Check if user is logged in
    const sessionResp = await _browser.runtime.sendMessage({ type: "getSession" });
    const loggedIn = sessionResp && sessionResp.session && sessionResp.session.user;
    if (!loggedIn) {
      console.log("User not logged in, skipping upload.");
      return;
    }

    // Get existing conversation
    const existingConvResp = await _browser.runtime.sendMessage({ type: "getConversationById", conv_id: convId });
    const existingConv = existingConvResp.conversation;
    let existingMessages = existingConv?.contents || [];

    const newMessages = [
      ...existingMessages,
      { role: "user", content: userMessage, chosen: "True", turn: existingMessages.length },
      {
        role: "assistant",
        content: assistantResponse,
        chosen: "True",
        ever_chosen: "True",
        turn: existingMessages.length + 1,
        note: "From chatgpt.com - plugin",
        system_prompt_id: null,
        prompt_name: "external_prompt",
        model: "ChatGPT"
      }
    ];

    if (existingConv) {
      const updateResp = await _browser.runtime.sendMessage({ type: "updateConversationWithId", conv_id: convId, newContents: newMessages });
      if (updateResp.error) console.error("Error updating conversation:", updateResp.error);
      else console.log("Conversation updated successfully via bridge.");
    } else {
      const createResp = await _browser.runtime.sendMessage({ type: "createConversationWithId", conv_id: convId, contents: newMessages });
      if (createResp.error) console.error("Error creating conversation:", createResp.error);
      else console.log("Conversation created successfully via bridge.");
    }
  }
});