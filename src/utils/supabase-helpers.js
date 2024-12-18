import supabase from "./supabase";

// ----------------------------
// User Info
// ----------------------------

export async function getUserInfo() {
    const {data, error} = await supabase.from("user-info").select();
    return {user_info:data, error};
}

export async function getUserInfoOrCreate(name) {
    const {user_info:u_info, error} = await getUserInfo();
    if (u_info === undefined || u_info.length === 0) {
        const { data:user_info, error } = await supabase
            .from("user-info")
            .insert({ first_name: name, num_conversations: 0, num_feedback: 0, num_pairs: 0, num_edits: 0, personalization_strength: 0})
            .select('*');
        return {data:user_info, error};
    }
    return {data:u_info, error};
}

export async function updateUserInfo(uid, new_info) {
    const { error } = await supabase
        .from('user-info')
        .update(new_info)
        .eq('uid', uid);

    return { error };
}

// ----------------------------
// Conversations
// ----------------------------

export async function getConversations() {
    const {data, error} = await supabase.from("conversations").select("title, last_updated, id").order('last_updated', {ascending: false});
    return {conversations:data, error};
}

export async function getConversation(conversation_id) {
    const {data, error} = await supabase.from("conversations").select().eq('id', conversation_id);
    return {conversation:data, error};
}

export async function uploadConversation(conversation_id, contents) {
    const { error } = await supabase
        .from('conversations')
        .update({ contents: contents, last_updated: new Date() })
        .eq('id', conversation_id);

    return { error };
}

export async function addTitleToConversation(conversation_id, title) {
    const { error } = await supabase
        .from('conversations')
        .update({ title: title })
        .eq('id', conversation_id);

    return { error };
}

export async function createConversation(title, contents) {
    const conversation = [{
        title: title,
        contents: contents,
        last_updated: new Date()
    }];

    const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select('*');

    return { data, error };
}

// ----------------------------
// Models
// ----------------------------

export async function getModels(uid) {
    const {data, error} = await supabase.from("models").select("name, id, provider, weight");

    if (error) {
        return { data, error };
    }

    // Update the users last model cache sync time
    const { error:error2 } = await supabase
        .from('user-info')
        .update({ last_model_cache_sync: new Date() })
        .eq('uid', uid);

    return {models:data, error2};
}

// ----------------------------
// Prompts
// ----------------------------

export async function getPrompts(uid) {
    const {data, error} = await supabase.from("prompts").select("prompt, id, weight, prompt_name");

    if (error) {
        return { data, error };
    }

    // Update the users last prompt cache sync time
    const { error:error2 } = await supabase
        .from('user-info')
        .update({ last_prompt_cache_sync: new Date() })
        .eq('uid', uid);

    return {prompts:data, error2};
}

// ----------------------------
// Personalized Prompts
// ----------------------------

export async function getPersonalizedPrompt(prompt_id) {
    const {data, error} = await supabase.from("personalized-prompts").select().eq('id', prompt_id);
    return {personalized_prompt:data, error};
}

export async function uploadPersonalizedPrompt(uid, contents, edited) {
    const prompt = [{
        prompt: contents,
        edited: edited
    }];

    const { data, error } = await supabase
        .from('personalized-prompts')
        .insert(prompt)
        .select('*');

    if (error) {
        return { error };
    }

    // Set the new personalized prompt id as the users personalized prompt id
    const { error:error2 } = await supabase
        .from('user-info')
        .update({ personalized_prompt_id: data[0].id })
        .eq('uid', uid);

    return { error };
}

// ----------------------------
// Globals
// ----------------------------

export async function getGlobals() {
    const {data, error} = await supabase.from("globals").select().limit(1).order('created_at', {ascending: false});
    return {globals:data, error};
}