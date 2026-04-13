interface User {
  User_Id: number;
  username: string;
  Name?: string;
  Date_of_Birth?: string;
  // Giữ lại một số trường từ interface cũ để tương thích với code hiện tại
  id?: string; // Map từ User_Id
  name?: string; // Map từ Name
  email?: string; // Có thể thêm trường email vào bảng Users trong tương lai
  role?: 'admin' | 'user';
}

export default User;