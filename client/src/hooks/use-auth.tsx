import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  resetPasswordRequestMutation: UseMutationResult<void, Error, { email: string }>;
  resetPasswordMutation: UseMutationResult<void, Error, { token: string; password: string }>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || "Erro ao fazer login");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/me"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || "Erro ao registrar usuário");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/me"], user);
      toast({
        title: "Registro realizado com sucesso",
        description: `Bem-vindo(a), ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || "Erro ao fazer logout");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      // Invalidar todas as queries que dependem de autenticação
      queryClient.invalidateQueries();
      // Limpar o cache de todas as queries
      queryClient.clear();
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado com segurança.",
      });
      
      // Forçar um redirecionamento
      window.location.href = "/login";
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordRequestMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await apiRequest("POST", "/api/reset-password-request", { email });
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || "Erro ao solicitar redefinição de senha");
      }
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await apiRequest("POST", "/api/reset-password", { token, password });
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || "Erro ao redefinir senha");
      }
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida com sucesso",
        description: "Você pode fazer login com sua nova senha agora.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na redefinição de senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        resetPasswordRequestMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}