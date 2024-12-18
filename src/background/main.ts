import browser from "webextension-polyfill";
import supabase from "~/utils/supabase";
import { getUserInfoOrCreate } from "~/utils/supabase-helpers";
// If you need the following services, keep them. Otherwise remove them.
// import constants from '~/services/constants'; 
// import moduleServices from '~/services/moduleServices';
// import userServices from '~/services/userServices';

async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    return { success: false, error: "Invalid email or password." };
  }

  const { user_metadata } = data.user;
  const firstName = user_metadata?.first_name || "Guest";
  const language = user_metadata?.language || "en";
  const { data: userInfo, error: userInfoError } = await getUserInfoOrCreate(firstName, language);

  if (userInfoError || !userInfo || userInfo.length === 0) {
    return { success: false, error: "Failed to fetch user info after login." };
  }

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

// On extension install
browser.runtime.onInstalled.addListener(({ reason }) => {
  console.log('Extension installed');
  // If you need to open a page on install, uncomment and adjust:
  // if (reason === 'install') {
  //   browser.tabs.update({ url: `${constants.URL}/download` });
  // }
});

// External messages (if you still need them)
browser.runtime.onMessageExternal.addListener(async (message) => {
  console.log("External Message", message)
  if (message.type === 'sign_in') {
    await browser.storage.sync.set({"uid": message.user})
  } else if (message.type === 'sign_out') {
    await browser.storage.sync.remove("uid")
  }
  return true;
});

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
  } else if (request.type === 'save_module') {
    // Adjust as needed if you still need this logic:
    // const knowledge = await moduleServices.updateKnowledge(request.data.checked, request.data.modules)
    // ...
    return null;
  } else if (request.type === 'popup_open') {
    // Example if you still need this logic:
    // const modules = await moduleServices.fetchModules(request.data);
    // return { modules };
    return { modules: [] };
  } else if (request.type === 'add_module') {
    // Example:
    // const response = await userServices.addUserModule(request.data);
    // return response;
    return {};
  } else if (request.type === 'sign_in') {
    // browser.tabs.create({ url: `${constants.URL}/login` });
    return null;
  } else if (request.type === 'sign_up') {
    // browser.tabs.create({ url: `${constants.URL}/signup` });
    return null;
  }

  return { error: "Unknown request type" };
});