import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6 p-8 bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-sm">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold text-zinc-100">
            Gestão Financeira
          </h1>
          <p className="text-sm text-zinc-400">Acesso restrito</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
          className="w-full"
        >
          <Button type="submit" className="w-full" variant="outline">
            Entrar com Google
          </Button>
        </form>
      </div>
    </div>
  );
}
