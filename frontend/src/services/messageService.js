import api from './api';

export const messageService = {
  async getConversations() {
    const response = await api.get('/conversations');
    return response.data;
  },

  async accessConversation(receiverId) {
    const response = await api.post('/conversations', { receiverId });
    return response.data;
  },

  async getMessages(conversationId) {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
  },

  async sendMessage(data) {
    const response = await api.post('/messages', data);
    return response.data;
  },

  async uploadMedia(formData, onUploadProgress) {
    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  async deleteMessage(messageId, scope = 'me') {
    const response = await api.delete(`/messages/${messageId}`, { params: { scope } });
    return response.data;
  },

  async updateMessage(messageId, text) {
    const response = await api.put(`/messages/${messageId}`, { text });
    return response.data;
  },

  async markConversationSeen(conversationId) {
    const response = await api.patch(`/messages/${conversationId}/seen`);
    return response.data;
  },

  async getUnreadCounts() {
    const response = await api.get('/messages/unread/counts');
    return response.data;
  },
};
