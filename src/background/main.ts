import browser from "webextension-polyfill";
import supabase from "~/utils/supabase";
import { getUserInfoOrCreate } from "~/utils/supabase-helpers";

async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) return { success: false, error: "Invalid email or password." };

  const { user_metadata } = data.user;
  const firstName = user_metadata?.first_name || "Guest";
  const language = user_metadata?.language || "en";
  const { data: userInfo, error: userInfoError } = await getUserInfoOrCreate(firstName, language);

  if (userInfoError || !userInfo || userInfo.length === 0) return { success: false, error: "Failed to fetch user info." };

  await browser.storage.local.set({
    session: data.session,
    userInfo: userInfo[0]
  });
  return { success: true };
}

async function logout() {
  await supabase.auth.signOut();
  await browser.storage.local.remove(['session', 'userInfo']);
  return { success: true };
}

async function getSession() {
  const result = await browser.storage.local.get("session");
  return result.session || null;
}

async function getUserInfo() {
  const result = await browser.storage.local.get("userInfo");
  return result.userInfo || null;
}

browser.runtime.onMessage.addListener(async (request) => {
  console.log('request in background', request);

  if (request.type === 'login') {
    const { email, password } = request;
    return await login(email, password);
  } else if (request.type === 'logout') {
    return await logout();
  } else if (request.type === 'getSession') {
    const session = await getSession();
    return { session };
  } else if (request.type === 'getUserInfo') {
    const userInfo = await getUserInfo();
    return { userInfo };
  } else if (request.type === 'getConversationById') {
    const { conv_id } = request;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conv_id)
      .single();
    return { conversation: data || null, error };
  } else if (request.type === 'createConversationWithId') {
    const { conv_id, contents } = request;
    const userInfo = await getUserInfo();
    const user_id = userInfo?.uid || null;

    console.log('user_id', user_id);

    const { data, error } = await supabase
      .from('conversations')
      .insert({ id: conv_id, contents: contents, last_updated: new Date(), user: user_id, title: 'ChatGPT Import' })
      .select('*');
    return { data, error };
  } else if (request.type === 'updateConversationWithId') {
    const { conv_id, newContents } = request;
    const { error } = await supabase
      .from('conversations')
      .update({ contents: newContents, last_updated: new Date() })
      .eq('id', conv_id);
    return { error };
  } else {
    return { error: "Unknown request type" };
  }
});