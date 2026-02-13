import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Game Project Setup Ready</h1>
        <p className="text-muted-foreground">
          This page validates the base shadcn-style UI component pipeline.
        </p>
        <Button>shadcn/ui Button Render Test</Button>
      </section>
    </main>
  );
}
