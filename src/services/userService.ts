import api from "./api";
import { ApiResponse, User } from "../types";

export interface UpdateProfileData {
  email?: string;
  password?: string;
}

export const userService = {
  // Obter usuário por ID
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Atualizar perfil do usuário
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    const response = await api.patch("/users/profile", data);
    return response.data;
  },

  // Deletar conta
  async deleteAccount(): Promise<ApiResponse<void>> {
    const response = await api.delete("/users/profile");
    return response.data;
  },

  // Upload de avatar
  async uploadAvatar(
    file: FormData
  ): Promise<ApiResponse<{ avatarUrl: string }>> {
    const response = await api.post("/users/avatar", file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default userService;
