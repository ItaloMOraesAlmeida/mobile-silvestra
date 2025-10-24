import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";

// Necessário para fechar o browser automaticamente após o login
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  type: "success" | "error" | "cancel";
  accessToken?: string;
  idToken?: string;
  user?: {
    email: string;
    name: string;
    picture: string;
  };
  error?: string;
}

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Configure o Google OAuth
  // Você precisará adicionar essas variáveis no .env ou app.json
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri: makeRedirectUri({
      scheme: "silvestra",
      path: "auth",
    }),
  });

  const [authResult, setAuthResult] = useState<GoogleAuthResult | null>(null);

  useEffect(() => {
    if (response?.type === "success") {
      setIsLoading(true);
      handleGoogleResponse(response);
    } else if (response?.type === "error") {
      setAuthResult({
        type: "error",
        error: response.error?.message || "Erro desconhecido",
      });
      setIsLoading(false);
    } else if (response?.type === "cancel") {
      setAuthResult({
        type: "cancel",
      });
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (response: any) => {
    try {
      const { authentication } = response;

      if (!authentication?.accessToken) {
        throw new Error("Token de acesso não encontrado");
      }

      // Buscar informações do usuário do Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();

      setAuthResult({
        type: "success",
        accessToken: authentication.accessToken,
        idToken: authentication.idToken,
        user: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      });
    } catch (error) {
      setAuthResult({
        type: "error",
        error: error instanceof Error ? error.message : "Erro ao autenticar",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setAuthResult(null);
    await promptAsync();
  };

  const resetAuth = () => {
    setAuthResult(null);
    setIsLoading(false);
  };

  return {
    signInWithGoogle,
    isLoading,
    authResult,
    resetAuth,
    disabled: !request,
  };
};
