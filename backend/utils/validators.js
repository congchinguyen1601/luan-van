// backend/utils/validators.js
export const isEmail = (value) => {
  if (typeof value !== 'string') return false;
  return /\S+@\S+\.\S+/.test(value);
};

export const isGioiTinh = (value) => {
  return value === 'Nam' || value === 'Nữ' || value === 'Khác';
};
// ✅ Số điện thoại 10 chữ số (nếu sau này bạn dùng lại)
export const isPhone10 = (value) => {
  if (typeof value !== 'string') return false
  return /^\d{10}$/.test(value)
}

// ✅ CMND/CCCD 12 chữ số (nếu sau này bạn dùng lại)
export const isCMND12 = (value) => {
  if (typeof value !== 'string') return false
  return /^\d{12}$/.test(value)
}



