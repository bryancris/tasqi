export async function saveChatMessages(supabase: any, userId: string, userMessage: string, aiResponse: string): Promise<void> {
  const { error: chatError } = await supabase
    .from('chat_messages')
    .insert([
      { content: userMessage, is_ai: false, user_id: userId },
      { content: aiResponse, is_ai: true, user_id: userId }
    ]);

  if (chatError) {
    console.error('Error saving chat messages:', chatError);
    throw chatError;
  }
}