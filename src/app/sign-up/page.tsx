import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.32))] items-center justify-center">
      <SignUp />
    </div>
  );
}
