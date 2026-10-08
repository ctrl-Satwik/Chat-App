import api from './api';

export const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async searchUsers(query) {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateProfile(formData) {
    const response = await api.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
