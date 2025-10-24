import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, type AuthSessionResult } from "expo-auth-session";

// Importante: Configurar o WebBrowser para fechar automaticamente
WebBrowser.maybeCompleteAuthSession();

// ⚠️ ATENÇÃO: Substitua pelos seus Client IDs reais obtidos no Google Cloud Console
// Veja a documentação em: CONFIGURACAO_GOOGLE_LOGIN.md
const ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

export interface GoogleAuthResponse {
  idToken: string;
  accessToken: string;
  user: {
    email: string;
    name: string;
    photo: string;
  };
}

/**
 * Hook personalizado para autenticação com Google
 * Use este hook dentro de um componente React
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ["profile", "email"],
    // Redirect URI é gerado automaticamente pelo Expo
    redirectUri: makeRedirectUri({
      scheme: "silvestra",
      path: "auth/google",
    }),
  });

  return { request, response, promptAsync };
}

/**
 * Processar resposta do Google e extrair dados do usuário
 */
export async function handleGoogleResponse(
  response: AuthSessionResult
): Promise<GoogleAuthResponse | null> {
  if (response?.type === "success") {
    const { authentication } = response;

    if (!authentication?.idToken) {
      throw new Error("ID Token não recebido do Google");
    }

    // Decodificar o ID Token para obter dados do usuário
    const userInfo = decodeIdToken(authentication.idToken);

    return {
      idToken: authentication.idToken,
      accessToken: authentication.accessToken,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        photo: userInfo.picture,
      },
    };
  }

  return null;
}

/**
 * Decodificar JWT ID Token (sem validação - apenas parse)
 * A validação real acontece na API
 */
function decodeIdToken(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    throw new Error("Falha ao decodificar ID Token");
  }
}
