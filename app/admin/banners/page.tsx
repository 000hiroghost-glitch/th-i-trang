import { getAdminBanners } from "../../../lib/banner-repository";
import BannerManager from "./BannerManager";

export default async function AdminBannersPage() {
  const banners = await getAdminBanners();

  return (
    <>
      <header className="admin-page-heading">
        <div><p className="admin-muted">KCJ STORE / NỘI DUNG</p><h1>Banner & khuyến mãi</h1></div>
      </header>
      <BannerManager initialBanners={banners} />
    </>
  );
}
