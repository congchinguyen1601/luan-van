import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import TrangHeader from './pages/User/TrangHeader'

// trang user
import DangNhap from './pages/User/DangNhap'
import DangKy from './pages/User/DangKy'
import QuenMatKhau from './pages/User/QuenMatKhau'
import TrangChu from './pages/User/TrangChu'
import ThanhToan from './pages/User/ThanhToan'
import GioHang from './pages/User/GioHang'
import ChiTietSanPham from './pages/User/ChiTietSanPham'
import ThongTinCaNhan from './pages/User/ThongTinCaNhan'
import DangKyNhaPhanPhoi from './pages/User/DangKyNhaPhanPhoi'
import DatHangThanhCong from './pages/User/DatHangThanhCong'
import LichSuDonHang from './pages/User/LichSuDonHang'
import ShopNPP from './pages/User/ShopNPP'
import CuaHang from './pages/User/CuaHang'


import QuanLyDanhMucNPP from './pages/NhaPhanPhoi/QuanLyDanhMucNPP'
import QuanLySanPhamNPP from './pages/NhaPhanPhoi/QuanLySanPhamNPP'
import QuanLyDonHangNPP from './pages/NhaPhanPhoi/QuanLyDonHangNPP'
import QuanLyDanhGiaNPP from './pages/NhaPhanPhoi/QuanLyDanhGiaNPP'
import QuanLyThongKeNPP from './pages/NhaPhanPhoi/QuanLyThongKeNPP'

// trang admin
import DangNhapAdmin from './pages/Admin/DangNhapAdmin'
import QuanLySanPham from './pages/Admin/QuanLySanPham'
import QuanLyDanhMuc from './pages/Admin/QuanLyDanhMuc'
import DashboardAdmin from './pages/Admin/DashboardAdmin'
import QuanLyTaiKhoan from './pages/Admin/QuanLyTaiKhoan'
import QuanLyNhaPhanPhoi from './pages/Admin/QuanLyNhaPhanPhoi'
import QuanLyMaGiamGia from './pages/Admin/QuanLyMaGiamGia'
import QuanLyThongKeAdmin from './pages/Admin/QuanLyThongKeAdmin'

// ========== HÀM LẤY ROLE ==========
function getRoleFlags() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const rawRole = user.ten_vai_tro || ''
  const roleNoAccent = rawRole
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  return {
    isAdmin: roleNoAccent.includes('admin'),
    isDistributor: roleNoAccent.includes('nha phan phoi'),
  }
}

// Bảo vệ route Admin
function AdminProtected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/admin/dang-nhap" replace />

  const { isAdmin } = getRoleFlags()
  if (!isAdmin) return <Navigate to="/trang-chu" replace />

  return children
}

// Bảo vệ route NPP
function DistributorProtected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/dang-nhap" replace />

  const { isDistributor } = getRoleFlags()
  if (!isDistributor) return <Navigate to="/trang-chu" replace />

  return children
}

export default function App() {
  const location = useLocation()

  //  header chung cho user, trừ login/register/quenmk
  const hideHeader =
    location.pathname === '/dang-nhap' ||
    location.pathname === '/dang-ky' ||
    location.pathname === '/quen-mat-khau' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/npp') ||
    location.pathname === '/nha-phan-phoi'

  return (
    <>
      {!hideHeader && <TrangHeader />}

      <Routes>
        {/* ========== TRANG CHỦ / USER ========== */}
        <Route path="/" element={<TrangChu />} />
        <Route path="/trang-chu" element={<TrangChu />} />

        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/quen-mat-khau" element={<QuenMatKhau />} />

        <Route path="/thanh-toan" element={<ThanhToan />} />
        <Route path="/gio-hang" element={<GioHang />} />
        <Route path="/san-pham/:id" element={<ChiTietSanPham />} />
        <Route path="/thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
        <Route path="/dang-ky-nha-phan-phoi" element={<DangKyNhaPhanPhoi />} />
        <Route path="/dat-hang-thanh-cong/:id" element={<DatHangThanhCong />} />
        <Route path="/lich-su-don-hang" element={<LichSuDonHang />} />
        <Route path="/cua-hang" element={<CuaHang />} />
        <Route path="/shop/:nppId" element={<ShopNPP />} />

        {/* ========== ADMIN LOGIN ========== */}
        <Route path="/admin/dang-nhap" element={<DangNhapAdmin />} />

        {/* ========== ADMIN (CHỦ SÀN) ========== */}
        <Route
          path="/admin"
          element={
            <AdminProtected>
              <DashboardAdmin />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/tai-khoan"
          element={
            <AdminProtected>
              <QuanLyTaiKhoan />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/nha-phan-phoi"
          element={
            <AdminProtected>
              <QuanLyNhaPhanPhoi />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/san-pham"
          element={
            <AdminProtected>
              <QuanLySanPham />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/danh-muc"
          element={
            <AdminProtected>
              <QuanLyDanhMuc />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/ma-giam-gia"
          element={
            <AdminProtected>
              <QuanLyMaGiamGia />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/thong-ke"
          element={
            <AdminProtected>
              <QuanLyThongKeAdmin />
            </AdminProtected>
          }
        />

        {/* ========== NHÀ PHÂN PHỐI  ========== */}
        <Route
          path="/npp"
          element={
            <DistributorProtected>
              <Navigate to="/npp/thong-ke" replace/>
            </DistributorProtected>
          }
        />
        <Route
          path="/npp/danh-muc"
          element={
            <DistributorProtected>
              <QuanLyDanhMucNPP />
            </DistributorProtected>
          }
        />
        <Route
          path="/npp/san-pham"
          element={
            <DistributorProtected>
              <QuanLySanPhamNPP />
            </DistributorProtected>
          }
        />
        <Route
          path="/npp/don-hang"
          element={
            <DistributorProtected>
              <QuanLyDonHangNPP />
            </DistributorProtected>
          }
        />
        <Route
          path="/npp/danh-gia"
          element={
            <DistributorProtected>
              <QuanLyDanhGiaNPP />
            </DistributorProtected>
          }
        />
        <Route
          path="/npp/thong-ke"
          element={
            <DistributorProtected>
              <QuanLyThongKeNPP />
            </DistributorProtected>
          }
        />

        {/* Route không tồn tại */}
        <Route path="*" element={<Navigate to="/trang-chu" replace />} />
      </Routes>
    </>
  )
}
