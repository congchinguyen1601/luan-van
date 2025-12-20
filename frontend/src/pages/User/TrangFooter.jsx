import './User.css' 

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col footer-col-about">
          <div className="footer-logo-line">
             <div className="home-logo-icon">
            <img src="/logo.png" alt="Nông sản sạch" />
          </div>  
            <div>
              <div className="footer-logo-title">NÔNG SẢN SẠCH</div>
              <div className="footer-logo-sub">Ăn sạch – Sống khỏe</div>
            </div>
          </div>

          <p className="footer-text">
            Nông Sản Sạch là cầu nối giúp bà con nông dân đưa sản phẩm sạch đến tay
            người tiêu dùng một cách dễ dàng và thuận tiện. Hợp tác với các đối tác
            vận chuyển, bà con được hỗ trợ chi phí gửi hàng để đạt hiệu quả cao nhất.
          </p>

          <p className="footer-text-bold">
            CÔNG TY CP THƯƠNG MẠI ĐIỆN TỬ NÔNG SẢN SẠCH
          </p>
          <p className="footer-text">
            📍 180 Đường Cao Lỗ ,Quận 8, TP. Hồ Chí Minh
          </p>
          <p className="footer-text">📞 0373304316</p>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Hỗ trợ khách hàng</h4>
          <ul className="footer-links">
            <li>Điều khoản sử dụng</li>
            <li>Chính sách bảo mật</li>
            <li>Câu hỏi thường gặp</li>
            <li>Bán hàng trên Nông Sản Sạch</li>
          </ul>
         
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Đối tác vận chuyển</h4>
          <div className="footer-partner-list">
            <div className="footer-partner-badge">FUTA Express</div>
          </div>

          <h4 className="footer-title footer-title-space">
            Đối tác thanh toán
          </h4>
          <div className="footer-partner-list">
            <div className="footer-partner-logo">Paypal</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
