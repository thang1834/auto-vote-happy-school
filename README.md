# 🌟 Auto Vote 5 Sao - Trường Học Hạnh Phúc

> **Tiện ích Userscript tự động hóa hỗ trợ khảo sát đánh giá 5 sao cho cổng bình chọn *Trường Học Hạnh Phúc* (treemvietnam.net.vn)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Tampermonkey%20%7C%20Violentmonkey-blue.svg)](https://www.tampermonkey.net/)
[![Language](https://img.shields.io/badge/Language-JavaScript%20ES6+-F7DF1E.svg?logo=javascript&logoColor=black)](#)
[![Version](https://img.shields.io/badge/Version-4.2.0-green.svg)](#)
[![Author](https://img.shields.io/badge/Author-thang1834-orange.svg?logo=github)](https://github.com/thang1834)

---

## 📖 Mục Lục

- [Mục Đích Học Tập & Nghiên Cứu](#-mục-đích-học-tập--nghiên-cứu)
- [Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer)](#-tuyên-bố-miễn-trừ-trách-nhiệm-disclaimer)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Hướng Dẫn Cài Đặt Chi Tiết (Từng Bước)](#-hướng-dẫn-cài-đặt-chi-tiết-từng-bước)
  - [Bước 1: Cài đặt tiện ích mở rộng Tampermonkey](#bước-1-cài-đặt-tiện-ích-mở-rộng-tampermonkey)
  - [Bước 2: Tạo Userscript mới trong Tampermonkey](#bước-2-tạo-userscript-mới-trong-tampermonkey)
  - [Bước 3: Dán mã nguồn và Lưu](#bước-3-dán-mã-nguồn-và-lưu)
  - [Bước 4: Sử dụng và Trải nghiệm](#bước-4-sử-dụng-và-trải-nghiệm)
- [Cấu Trúc Hoạt Động & Giải Thích Mã Nguồn](#-cấu-trúc-hoạt-động--giải-thích-mã-nguồn)
- [Tùy Biến Cấu Hình (CONFIG)](#-tùy-biến-cấu-hình-config)
- [Xử Lý Sự Cố (Troubleshooting)](#-xử-lý-sự-cố-troubleshooting)
- [Giấy Phép (License)](#-giấy-phép-license)
- [Tác Giả](#-tác-giả)

---

## 🎓 Mục Đích Học Tập & Nghiên Cứu

Mã nguồn dự án này được viết ra nhằm mục đích **giáo dục, nghiên cứu học thuật và chia sẻ kiến thức kỹ thuật** về:

1. **Kiến trúc Userscript hiện đại**: Tìm hiểu cơ chế hoạt động của Userscript trên môi trường Sandbox (Isolated World) và cách tương tác an toàn với ngữ cảnh cửa sổ gốc (*Page Window Context*).
2. **Kỹ thuật DOM Manipulation nâng cao**: Cách phối hợp giữa Native JavaScript DOM APIs và thư viện giao diện bên thứ ba (jQuery Bar Rating plugin) để kiểm soát các widget tùy biến.
3. **Giám sát trạng thái phía Client (Observer/Watcher Pattern)**: Nhận biết token phản hồi client-side của hệ thống bảo vệ Cloudflare Turnstile mà không can thiệp trái phép vào thuật toán Captcha.
4. **Quản lý & Dọn dẹp Client Storage**: Nghiên cứu vòng đời và cách giải phóng bộ nhớ lưu trữ trình duyệt bao gồm *Cookies, LocalStorage, SessionStorage, Cache API, Service Workers và IndexedDB*.

---

## ⚖️ Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer)

> [!CAUTION]
> **VUI LÒNG ĐỌC KỸ TRƯỚC KHI SỬ DỤNG:**
>
> 1. Dự án này được tạo ra **thuần túy cho mục đích nghiên cứu và học tập cá nhân**.
> 2. Tác giả **không khuyến khích, không cổ xúy và không chịu trách nhiệm** cho bất kỳ hành vi lạm dụng, gian lận, thao túng kết quả bình chọn, hoặc bất kỳ hành động nào vi phạm điều khoản dịch vụ (ToS) của trang web `treemvietnam.net.vn` hay các bên liên quan.
> 3. Người sử dụng công cụ này phải **tự chịu hoàn toàn trách nhiệm pháp lý và đạo đức** đối với hành vi sử dụng của chính mình.
> 4. Script **KHÔNG** tự động giải hoặc bypass Captcha. Người dùng vẫn phải tự tay xác thực tính hợp lệ của con người theo yêu cầu bảo mật của Cloudflare Turnstile.
> 5. Mã nguồn được phân phối dưới dạng **"AS IS"** (nguyên trạng), không đi kèm bất kỳ cam kết hay bảo đảm nào về tính ổn định, độ sẵn sàng hay tính liên tục khi website mục tiêu thay đổi giao diện/cấu trúc.

---

## ✨ Tính Năng Nổi Bật

- 🚀 **Tự động mở Popup khảo sát**: Nhận diện trang chi tiết của trường và tự kích hoạt mở form sau khi trang tải hoàn tất.
- ⭐ **Tự động tích chọn 5 sao toàn diện**: Sử dụng cơ chế tương tác 2 tầng (vừa gọi hàm `$.fn.barrating` gốc vừa dispatch DOM event dự phòng) để đảm bảo toàn bộ tiêu chí đều đạt điểm tối đa mà không bị sót.
- 🛡️ **Nhận diện trạng thái Cloudflare Turnstile thông minh**: Script tự động lắng nghe input token ẩn `#captcha1` và `#captcha2`. Ngay khi người dùng tick xanh Captcha thành công, script sẽ tự động kích hoạt bước kế tiếp.
- 🔐 **Hỗ trợ quy trình Đăng nhập Google**: Tự động nhận diện modal yêu cầu đăng nhập và click nút đăng nhập sau khi hoàn tất Captcha xác thực tài khoản.
- 📊 **Thanh trạng thái HUD trực quan**: Hiển thị bảng nổi Dark Glassmorphism ở góc màn hình cung cấp thông tin thời gian thực về tiến trình (đang chờ Captcha, đang tích 5 sao, đang nộp...).
- 🧹 **Tự động dọn dẹp dữ liệu phiên**: Tự động giải phóng toàn bộ Cache, LocalStorage, SessionStorage và Cookie khi tải trang.
- 🔄 **Tự động F5 làm mới**: Sau khi gửi phiếu thành công, trang sẽ tự động tải lại để người dùng sẵn sàng cho các thao tác tiếp theo.

---

## 🛠️ Hướng Dẫn Cài Đặt Chi Tiết (Từng Bước)

### Bước 1: Cài đặt tiện ích mở rộng Tampermonkey

Để chạy được Userscript, bạn cần cài đặt một trình quản lý Userscript trên trình duyệt của mình (khuyên dùng **Tampermonkey**):

1. Mở liên kết chính thức trên **Chrome Web Store**:  
   👉 [**Tampermonkey trên Chrome Web Store**](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Bấm vào nút **"Thêm vào Chrome"** (Add to Chrome).
3. Xác nhận **"Thêm tiện ích"** (Add extension) tại popup của trình duyệt.
4. *(Gợi ý)* Bấm vào biểu tượng mảnh ghép (Tiện ích) ở góc trên bên phải thanh địa chỉ duyệt web và **Ghim (Pin)** biểu tượng Tampermonkey để tiện theo dõi.

> [!NOTE]
> Tiện ích tương thích tốt với mọi trình duyệt nhân Chromium như **Google Chrome, Microsoft Edge, Cốc Cốc, Brave, Opera**, cũng như Mozilla Firefox.

---

### Bước 2: Tạo Userscript mới trong Tampermonkey

1. Nhấp chuột trái vào **biểu tượng Tampermonkey** trên thanh tiện ích của trình duyệt.
2. Chọn **"Bảng điều khiển"** (*Dashboard*).
3. Tại giao diện Dashboard, nhấp vào tab hoặc biểu tượng dấu cộng **`+`** (**Tạo tập lệnh mới** / *Create a new script*).
4. Một tab trình soạn thảo mã nguồn sẽ mở ra với template Userscript mặc định.

---

### Bước 3: Dán mã nguồn và Lưu

1. **Xóa sạch** toàn bộ code mẫu mặc định trong khung soạn thảo Tampermonkey (`Ctrl + A` rồi nhấn `Delete`).
2. Mở tệp **[`hehihi.js`](./hehihi.js)** trong thư mục dự án này, copy toàn bộ nội dung mã nguồn.
3. Dán toàn bộ mã nguồn vừa copy vào khung soạn thảo của Tampermonkey.
4. Nhấn tổ hợp phím **`Ctrl + S`** (hoặc chọn menu **Tệp (File) > Lưu (Save)**).
5. Tab soạn thảo sẽ tự đóng hoặc lưu thành công. Script **"Auto Vote 5 Sao - Trường Học Hạnh Phúc"** sẽ xuất hiện ở trạng thái **Bật (Enabled)** trong danh sách quản lý.

---

### Bước 4: Sử dụng và Trải nghiệm

1. Mở một liên kết trường học bất kỳ thuộc cổng bình chọn, ví dụ:  
   `https://treemvietnam.net.vn/truong-hoc-hanh-phuc/...`
2. **Quan sát góc dưới bên phải màn hình**: Bạn sẽ thấy một bảng màu đen nổi hiển thị thông báo tiến trình.
3. **Quy trình tự động hóa diễn ra như sau**:
   - ⏳ Script mở popup bình chọn.
   - ⭐ Script tự động đánh dấu 5 sao cho tất cả các tiêu chí khảo sát.
   - 🛡️ Bảng trạng thái chuyển sang màu xanh lá yêu cầu: *"Hãy tick ô xác thực Captcha bên dưới"*.
   - 👉 **Bạn chỉ cần dùng chuột tick vào ô xác thực Cloudflare Turnstile**.
   - 🚀 Sau khi Captcha tick xanh, script chờ khoảng 2 giây để đồng bộ backend rồi tự động click nút gửi bình chọn.
   - 🎉 Hiển thị thông báo thành công và tự động tải lại trang.

---

## 🧩 Cấu Trúc Hoạt Động & Giải Thích Mã Nguồn

Dưới đây là sơ đồ luồng hoạt động (Workflow Architecture) của script:

```
[Mở trang web]
       │
       ▼
[clearSiteData()] ──────────► Xóa Storage, Cache, Cookie cũ
       │
       ▼
[triggerOpenVote()] ────────► Tự động click nút mở popup
       │
       ▼
[startMasterWatcher()] ◄────► Vòng lặp giám sát (chu kỳ 350ms)
       │
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[Pha: Cần Login]                 [Pha: Form Vote]                 [Pha: Hết lượt vote]
   │                                │                                │
   ├─ Chưa tick: Báo người dùng     ├─ Tích 5 sao toàn bộ           └─ Hiển thị cảnh báo
   └─ Đã tick: Tự bấm Login Google  ├─ Chờ tick Captcha
                                    └─ Đã tick: Tự Submit & F5
```

### Chi tiết các hàm trọng tâm:

| Tên Hàm | Vai Trò & Cơ Chế Kỹ Thuật |
| :--- | :--- |
| `setStatus(html, color)` | Tạo và điều khiển Floating HUD thông báo trạng thái với hiệu ứng mờ kính (Glassmorphism), không chặn sự kiện chuột (`pointer-events: none`). |
| `injectPageScript(fn)` | Đưa hàm JavaScript vượt qua sandbox của Tampermonkey để tương tác trực tiếp với phiên bản jQuery và plugin `barrating` gốc của website. |
| `isElementVisible(el)` | Sử dụng `getBoundingClientRect()` và kiểm tra CSS `display` để xác định chính xác modal nào đang mở trên màn hình. |
| `getContainerCaptchaToken(selector)` | Quét thẻ `<input name="cf-turnstile-response">` để phát hiện chuỗi token hợp lệ (> 20 ký tự) khi người dùng hoàn thành kiểm tra chống bot. |
| `clearSiteData()` | Giải phóng bộ nhớ client: xóa LocalStorage, SessionStorage, gán hạn sử dụng Cookies về Epoch 1970, dọn Cache API, gỡ bỏ Service Workers và xóa cơ sở dữ liệu IndexedDB. |
| `executeVoteInPage()` | Phối hợp kích hoạt đa tầng: Gọi hàm `barrating('set', 5)`, giả lập sự kiện click chuột trên thẻ `<a>`, cập nhật value thẻ `<select>` và phát sự kiện `change`. |
| `startMasterWatcher()` | Cỗ máy trạng thái (State Machine) định kỳ kiểm tra các thành phần giao diện, điều phối luồng đăng nhập, bình chọn và xử lý ngoại lệ. |

---

## ⚙️ Tùy Biến Cấu Hình (CONFIG)

Bạn có thể chỉnh sửa đối tượng `CONFIG` ngay ở đầu file **[`hehihi.js`](./hehihi.js)** theo ý muốn:

```javascript
const CONFIG = {
    AUTO_CLEAR_SITE_DATA: true,      // Tự động xóa Cookie, LocalStorage khi vào trang
    AUTO_OPEN_POPUP: true,           // Tự động ấn mở popup khi vào trang
    AUTO_LOGIN_GOOGLE: true,         // Tự động ấn nút Đăng nhập sau khi tick Captcha
    AUTO_SUBMIT_AFTER_CAPTCHA: true, // Tự động gửi phiếu sau khi Captcha vote hoàn tất
    AUTO_REFRESH_AFTER_VOTE: true,   // Tự động F5 trang sau khi bình chọn xong
    DELAY_OPEN_MS: 1200,             // Độ trễ (ms) trước khi mở popup
    DELAY_SUBMIT_VOTE_MS: 2000,      // Thời gian chờ (ms) sau Captcha để nộp phiếu
    DELAY_REFRESH_MS: 1500,          // Thời gian trễ (ms) sau nộp trước khi tải lại trang
    WATCHER_INTERVAL_MS: 350         // Tần suất quét trạng thái DOM (ms)
};
```

---

## ❓ Xử Lý Sự Cố (Troubleshooting)

<details>
<summary><b>1. Popup không tự động mở khi tải trang?</b></summary>

- Kiểm tra xem bạn có đang ở đúng đường dẫn URL có tiền tố: `https://treemvietnam.net.vn/truong-hoc-hanh-phuc/*` hay không.
- Nếu mạng chậm làm trang tải lâu, hãy tăng giá trị `DELAY_OPEN_MS` từ `1200` lên `2500` trong `CONFIG`.
</details>

<details>
<summary><b>2. Script không tự bấm gửi sau khi đã tick Captcha?</b></summary>

- Đảm bảo ô Cloudflare Turnstile đã hiển thị dấu tick xanh hoàn chỉnh.
- Kiểm tra kết nối mạng; nếu máy chủ Cloudflare phản hồi chậm, token có thể mất 1-2 giây mới được cập nhật vào thẻ input ẩn.
- Mở DevTools (`F12` > Console) để kiểm tra xem trang web có ném ra lỗi JavaScript nào khác hay không.
</details>

<details>
<summary><b>3. Làm sao để tạm dừng script?</b></summary>

- Nhấp chuột trái vào biểu tượng Tampermonkey trên thanh công cụ và gạt công tắc chuyển trạng thái của script sang **Tắt** (*Disabled*), sau đó tải lại trang.
</details>

---

## 📄 Giấy Phép (License)

Dự án này được phân phối dưới giấy phép **MIT License**. Xem chi tiết tại tệp [LICENSE](./LICENSE).

```text
MIT License
Copyright (c) 2026 thang1834 (https://github.com/thang1834)
```

---

## 👤 Tác Giả

- **GitHub**: [@thang1834](https://github.com/thang1834)
- **Kho lưu trữ dự án**: [Auto Vote Happy School](https://github.com/thang1834/auto-vote-happy-school)

*Nếu dự án này hữu ích cho việc tìm hiểu về Userscript và tự động hóa web của bạn, hãy để lại một ⭐️ Star trên GitHub nhé!*
