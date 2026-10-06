// ==UserScript==
// @name         Auto Vote 5 Sao - Trường Học Hạnh Phúc
// @namespace    https://github.com/thang1834
// @version      4.2.0
// @description  Script tự động hóa hỗ trợ khảo sát/bình chọn 5 sao cho cổng Trường Học Hạnh Phúc (treemvietnam.net.vn): Tự động mở form đánh giá, tích 5 sao toàn bộ tiêu chí, phát hiện xác thực Captcha, nộp phiếu và dọn dẹp dữ liệu phiên. Phục vụ mục đích học tập & nghiên cứu Userscript.
// @author       thang1834 (https://github.com/thang1834)
// @homepageURL  https://github.com/thang1834/auto-vote-happy-school
// @supportURL   https://github.com/thang1834/auto-vote-happy-school/issues
// @license      MIT
// @match        https://treemvietnam.net.vn/truong-hoc-hanh-phuc/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=treemvietnam.net.vn
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/**
 * =========================================================================================
 * DỰ ÁN NGHIÊN CỨU & HỌC TẬP TỰ ĐỘNG HÓA TRÌNH DUYỆT (USERSCRIPT AUTOMATION)
 * Tác giả: thang1834 (https://github.com/thang1834)
 * Bản quyền: MIT License
 * 
 * MỤC ĐÍCH NGHIÊN CỨU:
 * - Tìm hiểu cơ chế thao tác DOM nâng cao qua Userscript trong Tampermonkey.
 * - Xử lý tương tác giữa môi trường Sandbox Userscript và Window Context gốc của trang.
 * - Lắng nghe phản hồi từ Cloudflare Turnstile token client-side mà không can thiệp trái phép.
 * - Quản trị và dọn dẹp toàn diện Client Storage (Cookies, Cache, LocalStorage, IndexedDB).
 * =========================================================================================
 */

(function () {
    'use strict';

    /**
     * BẢNG CẤU HÌNH TRUNG TÂM (CONFIG)
     * Người dùng có thể điều chỉnh các giá trị bên dưới để phù hợp với tốc độ mạng và nhu cầu.
     */
    const CONFIG = {
        // [1] Dọn dẹp dữ liệu: Tự động xóa Cookie, LocalStorage, SessionStorage khi tải trang
        AUTO_CLEAR_SITE_DATA: true,

        // [2] Mở popup: Tự động nhấn nút "Bình chọn ngay" sau khi truy cập trang chi tiết trường học
        AUTO_OPEN_POPUP: true,

        // [3] Đăng nhập Google: Tự động kích hoạt chuyển hướng Google Login sau khi tick Captcha đăng nhập thành công
        AUTO_LOGIN_GOOGLE: true,

        // [4] Gửi bình chọn: Tự động nhấn nút gửi xác nhận sau khi Captcha ở form vote đã hoàn tất
        AUTO_SUBMIT_AFTER_CAPTCHA: true,

        // [5] Làm mới trang: Tự động tải lại trang (F5) sau khi gửi bình chọn thành công để chuẩn bị cho lượt tiếp theo
        AUTO_REFRESH_AFTER_VOTE: true,

        // [6] Thời gian trễ (ms) trước khi tự động ấn mở popup bình chọn lúc mới tải trang
        DELAY_OPEN_MS: 1200,

        // [7] Thời gian chờ an toàn (ms) sau khi Captcha vote tick xanh để hệ thống backend đồng bộ token trước khi submit
        DELAY_SUBMIT_VOTE_MS: 2000,

        // [8] Thời gian trễ (ms) sau khi popup nộp thành công trước khi tiến hành reload lại trang
        DELAY_REFRESH_MS: 1500,

        // [9] Chu kỳ quét trạng thái của Master Watcher (ms)
        WATCHER_INTERVAL_MS: 350
    };

    /**
     * CÁC BIẾN QUẢN LÝ TRẠNG THÁI RUNTIME (FLAG CONTROLLERS)
     */
    let hasClickedLogin = false; // Ngăn chặn việc click nút đăng nhập Google nhiều lần lặp lại
    let hasSubmitted = false;    // Ngăn chặn việc click nút gửi bình chọn lặp lại trong cùng một phiên
    let statusBanner = null;     // Node phần tử DOM chứa thông báo trạng thái nổi ở góc màn hình

    /**
     * Hiển thị bảng điều khiển / thông báo trạng thái trực quan dạng HUD (Heads-Up Display)
     * ở góc dưới bên phải màn hình để người dùng nắm rõ script đang thực hiện hành động gì.
     *
     * @param {string} html - Nội dung HTML hoặc văn bản cần thông báo
     * @param {string} color - Mã màu hiển thị cho đường viền báo hiệu (Hex code)
     */
    function setStatus(html, color = '#ffc107') {
        if (!statusBanner) {
            statusBanner = document.createElement('div');
            statusBanner.id = 'auto-vote-status';
            
            // Áp dụng phong cách thiết kế hiện đại (Modern Dark Glassmorphism)
            Object.assign(statusBanner.style, {
                position: 'fixed',
                bottom: '25px',
                right: '25px',
                zIndex: '99999999',
                padding: '14px 20px',
                backgroundColor: 'rgba(20, 24, 30, 0.96)',
                color: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                lineHeight: '1.5',
                maxWidth: '380px',
                borderLeft: '5px solid #ffc107',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'none' // Tránh che khuất thao tác click chuột của người dùng
            });
            document.body.appendChild(statusBanner);
        }
        statusBanner.style.borderLeftColor = color;
        statusBanner.innerHTML = html;
    }

    /**
     * Tiêm (Inject) một hàm JavaScript vào trực tiếp Page Context của website.
     * 
     * Vấn đề kỹ thuật: Userscript mặc định chạy trong một Isolated World (ngữ cảnh cách ly),
     * không thể truy cập trực tiếp vào đối tượng jQuery ($) hay plugin 'barrating' đã được khởi tạo
     * trên Window gốc của trang. Hàm này vượt qua giới hạn bằng cách tạo thẻ <script> tạm thời.
     *
     * @param {Function} fn - Hàm logic cần thực thi trực tiếp trên trang gốc
     */
    function injectPageScript(fn) {
        const script = document.createElement('script');
        script.textContent = `(${fn.toString()})();`;
        (document.head || document.documentElement).appendChild(script);
        script.remove(); // Dọn dẹp thẻ script sau khi thực thi để giữ DOM sạch sẽ
    }

    /**
     * Kiểm tra một phần tử DOM có đang thực sự hiển thị trên màn hình người dùng hay không.
     * (Loại trừ các modal bị ẩn bởi CSS display:none, kích thước width/height = 0).
     *
     * @param {Element|null} el - Phần tử HTML cần kiểm tra
     * @returns {boolean} True nếu phần tử đang mở và hiển thị, ngược lại là false
     */
    function isElementVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
    }

    /**
     * Quét và phát hiện chuỗi mã thông báo (token) Cloudflare Turnstile Captcha
     * bên trong một vùng container cụ thể (ví dụ #captcha1 cho vote, #captcha2 cho login).
     * 
     * Nguyên lý: Sau khi người dùng xác thực thành công (dấu tick xanh), thư viện Cloudflare Turnstile
     * sẽ tự động ghi chuỗi token (độ dài > 20 ký tự) vào thẻ input ẩn có tên 'cf-turnstile-response'.
     *
     * @param {string} containerSelector - Bộ chọn CSS của vùng chứa Captcha
     * @returns {string|null} Chuỗi token nếu đã vượt qua Captcha, null nếu chưa hoàn tất
     */
    function getContainerCaptchaToken(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return null;
        
        // Tìm các input chứa response của Turnstile
        const inputs = container.querySelectorAll('input[name="cf-turnstile-response"], input[id*="response"]');
        for (const inp of inputs) {
            const val = (inp.value || inp.getAttribute('value') || '').trim();
            if (val.length > 20) {
                return val; // Token hợp lệ được tạo bởi Cloudflare
            }
        }
        return null;
    }

    /**
     * Cơ chế dọn dẹp toàn diện dữ liệu phiên làm việc phía máy khách (Client-Side Storage Cleanup).
     * Bao gồm: LocalStorage, SessionStorage, Cookies thông thường, Cache Storage, Service Workers, và IndexedDB.
     * 
     * Lưu ý kỹ thuật: Cookie bảo vệ cờ HttpOnly không thể bị can thiệp bởi JavaScript máy khách.
     */
    function clearSiteData() {
        if (!CONFIG.AUTO_CLEAR_SITE_DATA) return;

        // 1. Dọn dẹp LocalStorage và SessionStorage
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.warn('[Auto Clear] Lỗi xóa Web Storage:', e);
        }

        // 2. Dọn dẹp Cookies thông thường bằng cách đặt hạn sử dụng về quá khứ (Epoch time)
        try {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                
                // Xóa ở cấp độ path hiện tại
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                
                // Xóa ở cấp độ super domain (ví dụ: .treemvietnam.net.vn)
                const domainParts = location.hostname.split('.');
                if (domainParts.length > 1) {
                    const superDomain = '.' + domainParts.slice(-2).join('.');
                    document.cookie = name + `=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${superDomain}`;
                }
            }
        } catch (e) {
            console.warn('[Auto Clear] Lỗi xóa Cookies:', e);
        }

        // 3. Dọn dẹp Cache API Storage
        if ('caches' in window) {
            caches.keys().then(function (names) {
                for (let name of names) {
                    caches.delete(name);
                }
            }).catch(() => { });
        }

        // 4. Hủy đăng ký (Unregister) các Service Workers đang hoạt động ngầm
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            }).catch(() => { });
        }

        // 5. Xóa cơ sở dữ liệu IndexedDB của trình duyệt
        if (window.indexedDB && window.indexedDB.databases) {
            window.indexedDB.databases().then(dbs => {
                dbs.forEach(db => { window.indexedDB.deleteDatabase(db.name); });
            }).catch(() => { });
        }

        console.log('[Auto Clear] Đã thực hiện dọn dẹp Storage, Cache, Service Workers và Cookies.');
    }

    /**
     * Logic đánh giá 5 sao cho tất cả các tiêu chí trong biểu mẫu khảo sát.
     * Hàm này được nạp vào Page Context gốc để tương tác song song với 2 tầng:
     * - Tầng 1 (jQuery plugin): Kích hoạt plugin $.fn.barrating của thư viện giao diện website.
     * - Tầng 2 (Native DOM): Cập nhật giá trị thẻ <select>, thêm class CSS hiển thị ngôi sao và dispatch event.
     */
    function executeVoteInPage() {
        // --- XỬ LÝ QUA JQUERY & PLUGIN BARRATING NẾU TRANG CÓ NẠP THƯ VIỆN ---
        var $ = window.$ || window.jQuery;
        if ($) {
            try {
                // Gọi API chính thống của thư viện jQuery Bar Rating
                $('.rating').barrating('set', 5);
            } catch (e) { }

            // Giả lập click vào phần tử ngôi sao mức 5 trong widget barrating
            $('.br-widget').each(function () {
                var $star5 = $(this).find('a[data-rating-value="5"]');
                if ($star5.length) {
                    $star5.trigger('click');
                }
            });

            // Gán giá trị 5 cho thẻ select rating và phát sự kiện 'change'
            $('select.rating').each(function () {
                $(this).val('5').attr('data-rate-value', '5').trigger('change');
            });

            // Cập nhật text hiển thị số điểm đánh giá
            $('.selected-rating').text('5');
        }

        // --- XỬ LÝ DỰ PHÒNG QUA NATIVE JAVASCRIPT DOM ---
        // Đảm bảo hoạt động ngay cả khi jQuery không có sẵn hoặc bị lỗi
        document.querySelectorAll('.br-widget').forEach(function (widget) {
            var star5 = widget.querySelector('a[data-rating-value="5"]');
            if (star5) {
                widget.querySelectorAll('a').forEach(function (a) {
                    a.classList.add('br-selected');
                });
                star5.classList.add('br-current');
                // Gửi sự kiện click nhân tạo
                star5.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                star5.click();
            }
        });

        // Đồng bộ dữ liệu phần tử <select>
        document.querySelectorAll('select.rating').forEach(function (sel) {
            sel.value = '5';
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // Cập nhật nhãn thông báo kết quả điểm số
        document.querySelectorAll('.selected-rating').forEach(function (el) {
            el.textContent = '5';
        });
    }

    /**
     * Kích hoạt tự động mở modal/popup bình chọn từ giao diện trang chủ/chi tiết.
     */
    function triggerOpenVote() {
        const openBtn = document.querySelector('#vote-open a.btn-vote, #vote-open a, .btn-vote.vote-by-payment-detail');
        if (openBtn) {
            setStatus('⏳ Đang mở popup khảo sát...', '#17a2b8');
            openBtn.click();
        }
    }

    /**
     * TRÌNH ĐIỀU PHỐI VÀ THEO DÕI TRẠNG THÁI CHÍNH (MASTER WATCHER / STATE MACHINE)
     * Chạy theo chu kỳ định kỳ để liên tục kiểm tra giao diện người dùng đang ở pha nào:
     * - Pha A: Đang ở Popup yêu cầu Đăng nhập tài khoản Google.
     * - Pha B: Đang ở Popup biểu mẫu bình chọn 5 sao.
     * - Pha C: Kiểm tra các thông báo ngoại lệ (như hết lượt bình chọn trong ngày).
     */
    function startMasterWatcher() {
        setInterval(() => {
            const googleLoginBtn = document.querySelector('.login_with_google');
            const confirmVoteBtn = document.querySelector('#btn-confirm-vote');

            const isLoginOpen = isElementVisible(googleLoginBtn);
            const isVoteOpen = isElementVisible(confirmVoteBtn);

            // =========================================================================
            // NGỮ CẢNH 1: POPUP ĐĂNG NHẬP GOOGLE ĐANG HIỂN THỊ
            // =========================================================================
            if (isLoginOpen) {
                const loginToken = getContainerCaptchaToken('#captcha2');

                // Nếu chưa có token, nhắc người dùng click xác thực Captcha thủ công
                if (!loginToken) {
                    setStatus('🔐 <b>Chưa đăng nhập:</b><br><span style="color: #ffc107;">👉 Vui lòng tick Captcha để đăng nhập Google</span>', '#ffc107');
                } else {
                    // Khi đã phát hiện token Captcha hợp lệ từ Cloudflare
                    if (!hasClickedLogin && CONFIG.AUTO_LOGIN_GOOGLE) {
                        hasClickedLogin = true;
                        setStatus('✅ <b>Captcha xác thực thành công!</b><br>Đang mở cửa sổ Đăng nhập Google...', '#28a745');
                        
                        // Chờ một khoảng thời gian ngắn để đảm bảo giao diện ổn định trước khi trigger
                        setTimeout(() => {
                            googleLoginBtn.click();
                        }, 600);
                    }
                }
                return;
            }

            // =========================================================================
            // NGỮ CẢNH 2: POPUP FORM BÌNH CHỌN ĐANG HIỂN THỊ
            // =========================================================================
            if (isVoteOpen) {
                // Kiểm tra xem tất cả các tiêu chí đã được đánh giá đạt điểm 5 hay chưa
                const selectedRatingEls = document.querySelectorAll('.selected-rating');
                const allAreFive = selectedRatingEls.length > 0 && Array.from(selectedRatingEls).every(el => el.textContent.trim() === '5');

                if (!allAreFive) {
                    // Nếu chưa đủ 5 sao, tiêm hàm đánh giá vào trang gốc
                    injectPageScript(executeVoteInPage);
                    setStatus('🔄 Đang tự động tích 5 sao cho tất cả tiêu chí...', '#ffc107');
                } else {
                    // Sau khi đã chọn xong 5 sao, kiểm tra trạng thái Captcha ở form vote (#captcha1)
                    const voteToken = getContainerCaptchaToken('#captcha1');

                    if (!voteToken) {
                        // Nhắc người dùng tick ô Captcha chống bot
                        setStatus('⭐ <b>Đã chọn 5 sao cho tất cả tiêu chí!</b><br><span style="color: #4cd964; font-weight: bold;">👉 Hãy tick ô xác thực Captcha bên dưới</span>', '#4cd964');
                    } else {
                        // Khi Captcha form vote đã tick xanh và có token
                        if (!hasSubmitted && CONFIG.AUTO_SUBMIT_AFTER_CAPTCHA) {
                            hasSubmitted = true;
                            setStatus('✅ <b>Captcha đã xác thực thành công!</b><br>Chờ 2 giây để đồng bộ trước khi gửi...', '#28a745');

                            // Chờ thời gian trễ an toàn trước khi bấm nút xác nhận
                            setTimeout(() => {
                                setStatus('🚀 Đang gửi bình chọn...', '#28a745');
                                confirmVoteBtn.click();

                                // Sau khi gửi, hiển thị thông báo thành công và tiến hành tải lại trang
                                setTimeout(() => {
                                    setStatus('🎉 <b>Đã gửi bình chọn thành công!</b>', '#28a745');

                                    if (CONFIG.AUTO_REFRESH_AFTER_VOTE) {
                                        setTimeout(() => {
                                            setStatus('🔄 Đang tải lại trang...', '#17a2b8');
                                            window.location.reload();
                                        }, CONFIG.DELAY_REFRESH_MS);
                                    }

                                }, 500);
                            }, CONFIG.DELAY_SUBMIT_VOTE_MS);
                        }
                    }
                }
                return;
            }

            // =========================================================================
            // NGỮ CẢNH 3: KIỂM TRA NGOẠI LỆ (VÍ DỤ: HẾT LƯỢT BÌNH CHỌN TRONG NGÀY)
            // =========================================================================
            const maxVoteEl = document.getElementById('err-max-vote');
            if (maxVoteEl && maxVoteEl.innerText === '0' && hasSubmitted) {
                setStatus('⚠️ <b>Thông báo:</b> Bạn còn 0 lượt bình chọn trong ngày.', '#dc3545');
            }
        }, CONFIG.WATCHER_INTERVAL_MS);
    }

    /**
     * ĐIỂM KHỞI CHẠY (ENTRY POINT) CỦA SCRIPT
     */
    function init() {
        // Bước 1: Dọn dẹp dữ liệu phiên cũ để đảm bảo môi trường sạch
        clearSiteData();

        // Bước 2: Hiển thị thanh trạng thái ban đầu
        setStatus('🚀 Auto-Vote sẵn sàng...', '#6c757d');

        // Bước 3: Tự động mở popup nếu cấu hình được bật
        if (CONFIG.AUTO_OPEN_POPUP) {
            setTimeout(() => {
                triggerOpenVote();
            }, CONFIG.DELAY_OPEN_MS);
        }

        // Bước 4: Khởi động vòng lặp theo dõi trạng thái
        startMasterWatcher();
    }

    // Đảm bảo DOM đã tải xong trước khi thực thi
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();