import { useState } from "react";
import api from "../../services/api";
import "./User.css";

export default function QuenMatKhau() {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [msg, setMsg] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      await api.post("/xac-thuc/quen-mat-khau", { email });

      setMsg("Đã gửi OTP về email, vui lòng kiểm tra hộp thư.");
      setStep(2);
    } catch {
      setMsg("Không thể gửi OTP. Vui lòng thử lại.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMsg("");

    if (newPass !== confirmPass) {
      setMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await api.post("/xac-thuc/dat-mat-khau-moi", {
        email,
        otp,
        mat_khau_moi: newPass,  
      });

      setMsg("Đặt lại mật khẩu thành công!");
      setStep(3);
    } catch {
      setMsg("Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-card">

        {step === 1 && (
          <>
            <h1 className="auth-title">Quên mật khẩu</h1>
            <p className="auth-subtext">
              Nhập email để nhận mã OTP đặt lại mật khẩu.
            </p>

            {msg && <p className="auth-msg auth-msg-info">{msg}</p>}

            <form onSubmit={handleSendOTP}>
              <div className="auth-input-group">
                <label>Email khôi phục</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button className="auth-btn-primary">Gửi mã OTP</button>
            </form>

            <div className="auth-bottom-text">
              <a className="auth-link" href="/dang-nhap">
                ← Quay lại đăng nhập
              </a>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title">Đặt lại mật khẩu</h1>
            <p className="auth-subtext">
              Nhập OTP đã gửi vào email để khôi phục tài khoản.
            </p>

            {msg && <p className="auth-msg auth-msg-info">{msg}</p>}

            <form onSubmit={handleResetPassword}>
              <div className="auth-input-group">
                <label>Email</label>
                <input type="email" className="auth-input" value={email} disabled />
              </div>

              <div className="auth-input-group">
                <label>Mã OTP</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  className="auth-input"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="auth-input"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>

              <button className="auth-btn-primary">Đặt lại mật khẩu</button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="auth-title">Hoàn tất!</h1>
            <p className="auth-subtext">{msg}</p>

            <div className="auth-bottom-text">
              <a className="auth-link" href="/dang-nhap">
                → Đăng nhập ngay
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
