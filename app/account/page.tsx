import AccountClient from "./AccountClient";
import AdminAccountPanel from "./AdminAccountPanel";
import { getAdminUser } from "../../lib/auth";

export const metadata = { title: "Tài khoản của tôi — KCJ Store" };

export default async function AccountPage() {
  const admin = await getAdminUser();
  return <AccountClient adminPanel={admin ? <AdminAccountPanel /> : null} />;
}
