import { ErrorScreen } from "@/components/error";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <ErrorScreen />
      </div>
    </div>
  )
}
