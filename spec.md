# Bản Kế Hoạch Phát Triển Dự Án Luxe & Azure Editorial

Tài liệu này tổng hợp các hạng mục nâng cấp và phát triển hệ thống Frontend (Vue 3) và Backend (FastAPI), đảm bảo tính nhất quán, chuyên nghiệp và tối ưu trải nghiệm người dùng.

## 1. GIAI ĐOẠN 1: Tái cấu trúc & Nền móng (Refactoring & Architecture)
* **Quy Chuẩn Cấu Trúc Thư Mục:** Đồng bộ hóa toàn bộ các module trong thư mục `src/pages/` theo chuẩn của module Auth hiện tại (`components`, `handler`, `services`, `types`) để đảm bảo tính dễ bảo trì (Clean Code).
* **Quản lý State (Pinia):** Cài đặt và thiết lập Pinia để lưu trữ trạng thái toàn cục (Global State) cho: Thông tin User đăng nhập, Giỏ hàng (Cart), và Dữ liệu UI.
* **Hệ Thống Layout:** Thay thế toàn bộ các thanh navbar cũ bằng `HeaderLayout.vue` và `FooterLayout.vue` để dùng chung cho toàn bộ website thông qua `DefaultLayout.vue`.

## 2. GIAI ĐOẠN 2: Giao diện cốt lõi (UI/UX)
* **Đồng bộ Design System:** Áp dụng chung 1 Font chữ duy nhất (ví dụ: *Inter* hoặc *IBM Plex Serif*) và 1 bảng màu đa dạng, tinh tế từ file HTML gốc (sử dụng các tone màu như `#17b0cf`, `#e7f1f3`, `#f5f5f0`) cho toàn bộ các màn hình thay vì chủ đạo trắng đen.
* **Chuyển Đổi HTML sang Vue:** Thực hiện rà soát các file `.html` trong thư mục dự án màn hình chính, chuyển đổi thành các Vue Component tương ứng và cập nhật giao diện mới(là phần xem sản phẩm và trang cá nhân)
* **Box Chat AI (Góc phải dưới):** Tạo UI khung chat giả lập ở góc phải dưới màn hình tại thư mục `/chat-ai`. Giai đoạn hiện tại chỉ cần giao diện bấm vào hiện ra phần chat (chưa cần logic AI).

## 3. GIAI ĐOẠN 3: Luồng Mua hàng (Shopping Flow)
* **Trang Sản phẩm (Product):** Xây dựng giao diện Danh sách sản phẩm và Chi tiết sản phẩm.
* **Logic Giỏ hàng thông minh:** * Cho phép người dùng chưa đăng nhập vẫn có thể xem danh sách sản phẩm, chi tiết sản phẩm và **thêm hàng vào giỏ** (lưu trữ tạm qua LocalStorage hoặc Pinia).
  * **Xác Thực Khi Thanh Toán:** Chỉ bắt buộc Đăng nhập/Đăng ký khi người dùng nhấn nút "Thanh toán" hoặc "Xem Giỏ Hàng" (Checkout).
* **Trang Thanh toán (Checkout):** Xây dựng luồng điền thông tin giao hàng và áp dụng Voucher.

## 4. GIAI ĐOẠN 4: Quản trị viên (Admin) & Khách hàng (Profile)
* **Banner Voucher Linh Hoạt (Dynamic Voucher):**
  * **Admin:** Có form để tùy chỉnh các field như: Màu nền, Ảnh banner, Tiêu đề phụ, Thứ tự ưu tiên (`sort_order`).
  * **Frontend:** Đọc dữ liệu từ API và render giao diện thẻ Voucher động dựa trên các field Admin đã nhập thay vì hard-code.
* **Lịch sử Đơn hàng (User Profile):** Tạo trang để khách hàng có thể theo dõi đơn hàng cá nhân