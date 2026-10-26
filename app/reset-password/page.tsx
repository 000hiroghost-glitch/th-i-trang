import ResetPasswordForm from "./ResetPasswordForm";
import "../account/account.css";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <ResetPasswordForm token={token} />;
}
