import pool from '../db.js'
import PDFDocument from 'pdfkit'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fontRegularPath = path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf')
const fontBoldPath = path.join(__dirname, '..', 'fonts', 'Roboto-Bold.ttf')

const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 0.1)

const getDateRange = (req) => {
  const { from, to } = req.query
  return {
    fromDate: from || '1970-01-01',
    toDate: to || '2999-12-31',
  }
}


export const thongKeAdminTheoNPP = async (req, res) => {
  try {
    const { fromDate, toDate } = getDateRange(req)

    const [rows] = await pool.query(
      `
      SELECT
        npp.nha_phan_phoi_id,
        npp.ten_don_vi,
        tk.email,
        COUNT(DISTINCT dh.don_hang_id) AS so_don,
        SUM(ct.thanh_tien) AS doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      JOIN nha_phan_phoi npp ON ct.nha_phan_phoi_id = npp.nha_phan_phoi_id
      JOIN tai_khoan tk ON npp.tai_khoan_id = tk.tai_khoan_id
      WHERE dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      GROUP BY npp.nha_phan_phoi_id, npp.ten_don_vi, tk.email
      `,
      [fromDate, toDate]
    )

    const list = rows.map((r) => {
      const doanhThu = Number(r.doanh_thu || 0)
      const hoaHongSan = Math.round(doanhThu * COMMISSION_RATE)
      return {
        nha_phan_phoi_id: r.nha_phan_phoi_id,
        ten_npp: r.ten_don_vi,
        email: r.email,
        so_don: Number(r.so_don || 0),
        doanh_thu: doanhThu,
        hoa_hong_san: hoaHongSan,
        hoa_hong_npp: doanhThu - hoaHongSan,
      }
    })

    return res.json({ from: fromDate, to: toDate, list })
  } catch (err) {
    console.error('thongKeAdminTheoNPP error:', err)
    return res.status(500).json({ message: 'Lỗi thống kê admin theo NPP' })
  }
}


export const thongKeAdminTheoSanPham = async (req, res) => {
  try {
    const { fromDate, toDate } = getDateRange(req)

    const [rows] = await pool.query(
      `
      SELECT
        sp.san_pham_id,
        sp.ten_san_pham,
        npp.ten_don_vi AS ten_npp,
        SUM(ct.so_luong) AS tong_so_luong,
        SUM(ct.thanh_tien) AS tong_doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      JOIN san_pham sp ON ct.san_pham_id = sp.san_pham_id
      JOIN nha_phan_phoi npp ON ct.nha_phan_phoi_id = npp.nha_phan_phoi_id
      WHERE dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      GROUP BY sp.san_pham_id, sp.ten_san_pham, npp.ten_don_vi
      ORDER BY tong_doanh_thu DESC
      `,
      [fromDate, toDate]
    )

    const list = rows.map((r) => {
      const doanhThu = Number(r.tong_doanh_thu || 0)
      const hoaHongSan = Math.round(doanhThu * COMMISSION_RATE)
      return {
        san_pham_id: r.san_pham_id,
        ten_san_pham: r.ten_san_pham,
        ten_npp: r.ten_npp,
        tong_so_luong: Number(r.tong_so_luong || 0),
        tong_doanh_thu: doanhThu,
        ty_le_hoa_hong_san: COMMISSION_RATE * 100,
        hoa_hong_san: hoaHongSan,
        hoa_hong_npp: doanhThu - hoaHongSan,
      }
    })

    return res.json({ from: fromDate, to: toDate, list })
  } catch (err) {
    console.error('thongKeAdminTheoSanPham error:', err)
    return res
      .status(500)
      .json({ message: 'Lỗi thống kê admin theo sản phẩm' })
  }
}


export const thongKeNPPTongQuan = async (req, res) => {
  try {
    const taiKhoanId = req.user?.tai_khoan_id || req.user?.id
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định tài khoản' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [taiKhoanId]
    )
    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }
    const nppId = nppRows[0].nha_phan_phoi_id

    const { fromDate, toDate } = getDateRange(req)

    const [rows] = await pool.query(
      `
      SELECT
        COUNT(DISTINCT dh.don_hang_id) AS tong_don,
        SUM(ct.so_luong) AS tong_so_luong,
        SUM(ct.thanh_tien) AS tong_doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      WHERE ct.nha_phan_phoi_id = ?
        AND dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      `,
      [nppId, fromDate, toDate]
    )

    const row = rows[0] || {}
    const tongDoanhThu = Number(row.tong_doanh_thu || 0)
    const tongSoLuong = Number(row.tong_so_luong || 0)
    const tongDon = Number(row.tong_don || 0)

    const tongHoaHongSan = Math.round(tongDoanhThu * COMMISSION_RATE)
    const tongHoaHongNPP = tongDoanhThu - tongHoaHongSan

    return res.json({
      from: fromDate,
      to: toDate,
      tong_don: tongDon,
      tong_so_luong: tongSoLuong,
      tong_doanh_thu: tongDoanhThu,
      tong_hoa_hong_san: tongHoaHongSan,
      tong_hoa_hong_npp: tongHoaHongNPP,
    })
  } catch (err) {
    console.error('thongKeNPPTongQuan error:', err)
    return res.status(500).json({ message: 'Lỗi thống kê tổng quan NPP' })
  }
}

export const thongKeNPPTheoSanPham = async (req, res) => {
  try {
    const taiKhoanId = req.user?.tai_khoan_id || req.user?.id
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định tài khoản' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [taiKhoanId]
    )
    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }
    const nppId = nppRows[0].nha_phan_phoi_id

    const { fromDate, toDate } = getDateRange(req)

    const [rows] = await pool.query(
      `
      SELECT
        sp.san_pham_id,
        sp.ten_san_pham,
        SUM(ct.so_luong) AS tong_so_luong,
        SUM(ct.thanh_tien) AS tong_doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      JOIN san_pham sp ON ct.san_pham_id = sp.san_pham_id
      WHERE ct.nha_phan_phoi_id = ?
        AND dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      GROUP BY sp.san_pham_id, sp.ten_san_pham
      ORDER BY tong_doanh_thu DESC
      `,
      [nppId, fromDate, toDate]
    )

    const list = rows.map((r) => {
      const doanhThu = Number(r.tong_doanh_thu || 0)
      const hoaHongSan = Math.round(doanhThu * COMMISSION_RATE)
      return {
        san_pham_id: r.san_pham_id,
        ten_san_pham: r.ten_san_pham,
        tong_so_luong: Number(r.tong_so_luong || 0),
        tong_doanh_thu: doanhThu,
        ty_le_hoa_hong_san: COMMISSION_RATE * 100,
        hoa_hong_san: hoaHongSan,
        hoa_hong_npp: doanhThu - hoaHongSan,
      }
    })

    return res.json({ list })
  } catch (err) {
    console.error('thongKeNPPTheoSanPham error:', err)
    return res.status(500).json({ message: 'Lỗi thống kê theo sản phẩm NPP' })
  }
}

export const exportThongKeAdminPDF = async (req, res) => {
  try {
    const { fromDate, toDate } = getDateRange(req)

    // Tổng quan đơn
    const [overviewRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS tong_don,
        SUM(CASE WHEN trang_thai_don_hang = 'Hoàn thành' THEN 1 ELSE 0 END) AS don_hoan_thanh,
        SUM(CASE WHEN trang_thai_don_hang = 'Đã hủy' THEN 1 ELSE 0 END) AS don_da_huy,
        SUM(CASE WHEN trang_thai_don_hang LIKE 'Yêu cầu trả hàng%' THEN 1 ELSE 0 END) AS don_yeu_cau_tra
      FROM don_hang
      WHERE DATE(ngay_dat) BETWEEN ? AND ?
      `,
      [fromDate, toDate]
    )
    const overview =
      overviewRows[0] || {
        tong_don: 0,
        don_hoan_thanh: 0,
        don_da_huy: 0,
        don_yeu_cau_tra: 0,
      }

    // Doanh thu theo NPP
    const [rows] = await pool.query(
      `
      SELECT
        npp.ten_don_vi,
        SUM(ct.thanh_tien) AS doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      JOIN nha_phan_phoi npp ON ct.nha_phan_phoi_id = npp.nha_phan_phoi_id
      WHERE dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      GROUP BY npp.ten_don_vi
      `,
      [fromDate, toDate]
    )

    const perNpp = rows.map((r) => {
      const doanhThu = Number(r.doanh_thu || 0)
      const hoaHongSan = Math.round(doanhThu * COMMISSION_RATE)
      return {
        ten_don_vi: r.ten_don_vi,
        doanh_thu: doanhThu,
        hoa_hong_san: hoaHongSan,
      }
    })

    const tongDoanhThu = perNpp.reduce((s, x) => s + x.doanh_thu, 0)
    const tongHoaHong = perNpp.reduce((s, x) => s + x.hoa_hong_san, 0)

    const doc = new PDFDocument({ margin: 40, size: 'A4' })

    let fontBody = 'Helvetica'
    let fontTitle = 'Helvetica-Bold'
    try {
      doc.registerFont('VN-Regular', fontRegularPath)
      doc.registerFont('VN-Bold', fontBoldPath)
      fontBody = 'VN-Regular'
      fontTitle = 'VN-Bold'
    } catch (e) {
      console.error('Không load được font Unicode, dùng font mặc định:', e)
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="thong-ke-admin-${fromDate}-to-${toDate}.pdf"`
    )

    doc.pipe(res)
    doc.font(fontTitle).fontSize(18).text('BÁO CÁO THỐNG KÊ TOÀN SÀN', {
      align: 'center',
    })

    doc
      .moveDown(0.5)
      .font(fontBody)
      .fontSize(11)
      .text(`Khoảng thời gian: ${fromDate} đến ${toDate}`)
    doc.moveDown()

    doc.font(fontTitle).fontSize(13).text('I. Tổng quan đơn hàng', {
      underline: true,
    })
    doc.moveDown(0.3)
    doc.font(fontBody).fontSize(11)
    doc.text(`Tổng số đơn: ${overview.tong_don}`)
    doc.text(`Đơn hoàn thành: ${overview.don_hoan_thanh}`)
    doc.text(`Đơn đã hủy: ${overview.don_da_huy}`)
    doc.text(`Đơn có yêu cầu trả hàng: ${overview.don_yeu_cau_tra}`)
    doc.moveDown()

    doc.font(fontTitle).fontSize(13).text('II. Doanh thu theo Nhà phân phối', {
      underline: true,
    })
    doc.moveDown(0.3)
    doc.font(fontBody).fontSize(11)
    doc.text(`Tổng doanh thu: ${tongDoanhThu.toLocaleString('vi-VN')} đ`)
    doc.text(
      `Tổng hoa hồng sàn (${(COMMISSION_RATE * 100).toFixed(
        0
      )}%): ${tongHoaHong.toLocaleString('vi-VN')} đ`
    )
    doc.moveDown()

    const startX = 40
    let y = doc.y
    const colWidths = [40, 220, 120, 120] 

    const drawRow = (values, isHeader = false) => {
      let x = startX
      values.forEach((val, i) => {
        doc
          .font(isHeader ? fontTitle : fontBody)
          .fontSize(isHeader ? 11 : 10)
          .text(String(val), x + 2, y, { width: colWidths[i] - 4 })
        x += colWidths[i]
      })
      y += 18
    }

    drawRow(['STT', 'Nhà phân phối', 'Doanh thu', 'Hoa hồng sàn'], true)

    perNpp.forEach((item, idx) => {
      if (y > 760) {
        doc.addPage()
        y = 40
      }
      drawRow([
        idx + 1,
        item.ten_don_vi,
        item.doanh_thu.toLocaleString('vi-VN') + ' đ',
        item.hoa_hong_san.toLocaleString('vi-VN') + ' đ',
      ])
    })
    doc.end()
  } catch (err) {
    console.error('thongKeAdminPDF error:', err)
    return res.status(500).json({ message: 'Lỗi xuất PDF thống kê admin' })
  }
}

export const exportThongKeNPPPDF = async (req, res) => {
  try {
    const taiKhoanId = req.user?.tai_khoan_id || req.user?.id
    if (!taiKhoanId) {
      return res.status(401).json({ message: 'Không xác định tài khoản' })
    }

    const [nppRows] = await pool.query(
      'SELECT nha_phan_phoi_id, ten_don_vi FROM nha_phan_phoi WHERE tai_khoan_id = ?',
      [taiKhoanId]
    )
    if (!nppRows.length) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin Nhà phân phối' })
    }

    const npp = nppRows[0]
    const { fromDate, toDate } = getDateRange(req)

    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(DISTINCT dh.don_hang_id) AS so_don_hoan_thanh,
        SUM(ct.so_luong) AS tong_so_luong,
        SUM(ct.thanh_tien) AS doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      WHERE ct.nha_phan_phoi_id = ?
        AND dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      `,
      [npp.nha_phan_phoi_id, fromDate, toDate]
    )

    const summary = summaryRows[0] || {
      so_don_hoan_thanh: 0,
      tong_so_luong: 0,
      doanh_thu: 0,
    }

    const doanhThu = Number(summary.doanh_thu || 0)
    const hoaHongSan = Math.round(doanhThu * COMMISSION_RATE)

    const [topProductRows] = await pool.query(
      `
      SELECT
        sp.ten_san_pham,
        SUM(ct.so_luong) AS tong_so_luong,
        SUM(ct.thanh_tien) AS tong_doanh_thu
      FROM chi_tiet_don_hang ct
      JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
      JOIN san_pham sp ON ct.san_pham_id = sp.san_pham_id
      WHERE ct.nha_phan_phoi_id = ?
        AND dh.trang_thai_don_hang = 'Hoàn thành'
        AND DATE(dh.ngay_dat) BETWEEN ? AND ?
      GROUP BY sp.san_pham_id, sp.ten_san_pham
      ORDER BY tong_doanh_thu DESC
      LIMIT 10
      `,
      [npp.nha_phan_phoi_id, fromDate, toDate]
    )

        const doc = new PDFDocument({ margin: 40, size: 'A4' })

    let fontBody = 'Helvetica'
    let fontTitle = 'Helvetica-Bold'
    try {
      doc.registerFont('VN-Regular', fontRegularPath)
      doc.registerFont('VN-Bold', fontBoldPath)
      fontBody = 'VN-Regular'
      fontTitle = 'VN-Bold'
    } catch (e) {
      console.error('Không load được font Unicode, dùng font mặc định:', e)
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="thong-ke-npp-${npp.nha_phan_phoi_id}-${fromDate}-to-${toDate}.pdf"`
    )

    doc.pipe(res)

    doc
      .font(fontTitle)
      .fontSize(18)
      .text('BÁO CÁO DOANH THU NHÀ PHÂN PHỐI', { align: 'center' })
    doc.moveDown(0.5)
    doc.font(fontBody).fontSize(12).text(`Nhà phân phối: ${npp.ten_don_vi}`)
    doc.font(fontBody).fontSize(11).text(`Khoảng thời gian: ${fromDate} đến ${toDate}`)
    doc.moveDown()

    doc.font(fontTitle).fontSize(13).text('I. Tổng quan', { underline: true })
    doc.moveDown(0.3)
    doc.font(fontBody).fontSize(11)
    doc.text(
      `Số đơn hoàn thành: ${Number(summary.so_don_hoan_thanh || 0)}`
    )
    doc.text(
      `Tổng số lượng bán: ${Number(summary.tong_so_luong || 0)}`
    )
    doc.text(`Tổng doanh thu: ${doanhThu.toLocaleString('vi-VN')} đ`)
    doc.text(
      `Hoa hồng sàn (${(COMMISSION_RATE * 100).toFixed(
        0
      )}%): ${hoaHongSan.toLocaleString('vi-VN')} đ`
    )
    doc.text(
      `Doanh thu thực nhận (ước tính): ${(doanhThu - hoaHongSan).toLocaleString(
        'vi-VN'
      )} đ`
    )
    doc.moveDown()

    doc.font(fontTitle).fontSize(13).text('II. Top sản phẩm', { underline: true })
    doc.moveDown(0.3)

    const startX = 40
    let y = doc.y
    const colWidths = [30, 230, 80, 120] 

    const drawRow = (values, isHeader = false) => {
      let x = startX
      values.forEach((val, i) => {
        doc
          .font(isHeader ? fontTitle : fontBody)
          .fontSize(isHeader ? 11 : 10)
          .text(String(val), x + 2, y, { width: colWidths[i] - 4 })
        x += colWidths[i]
      })
      y += 18
    }

    drawRow(['#', 'Sản phẩm', 'SL', 'Doanh thu'], true)

    topProductRows.forEach((sp, idx) => {
      if (y > 760) {
        doc.addPage()
        y = 40
      }
      drawRow([
        idx + 1,
        sp.ten_san_pham,
        Number(sp.tong_so_luong || 0),
        Number(sp.tong_doanh_thu || 0).toLocaleString('vi-VN') + ' đ',
      ])
    })

    doc.end()

  } catch (err) {
    console.error('thongKeNPPPDF error:', err)
    return res.status(500).json({ message: 'Lỗi xuất PDF thống kê NPP' })
  }
}
