import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.32))] items-center justify-center">
      <SignIn />
    </div>
  );
}
