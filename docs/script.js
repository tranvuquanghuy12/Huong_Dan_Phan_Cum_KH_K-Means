// --- CẤU HÌNH SERVER ---
const TELEDRIVE_API = 'http://127.0.0.1:8080';

/* ===============================
      HÀM HỖ TRỢ (GIỮ NGUYÊN)
================================*/
async function safeJSON(response) {
 const text = await response.text();
 try {
 return text ? JSON.parse(text) : {};
 } catch { return {}; }
}
function getCleanText(el) {
 return el ? el.textContent.trim() : "";
}

/* ===============================
      HÀM LOAD CONTENT (GIỮ NGUYÊN)
================================*/
window.loadContent = async function(id, title) {
    if (id === 'upload_page' && !title) {
        title = "Tải File Lên (API)";
    }
    
    if (!title) {
        const item = document.querySelector(`li[data-target="${id}"]`);
        title = getCleanText(item) || "Thông tin";
    }
    
    const bc = document.getElementById('breadcrumb-current');
    if (bc) bc.innerText = title;

    if (id && id !== 'upload_page') {
        const primaryTarget = document.querySelector(`li[data-target="${id}"]`);
        if (primaryTarget) {
             document.querySelectorAll('#guide-menu li').forEach(i => i.classList.remove('active'));
             primaryTarget.classList.add('active');
        }
    }

    const contentDisplay = document.getElementById('content-display');
    contentDisplay.innerHTML = `<div class="loader"></div>`;

    await new Promise(r => setTimeout(r, 200));

    try {
        if (id === 'upload_page') {
            contentDisplay.innerHTML = `
                <div class="post-content" style="max-width: 600px; margin: 0 auto;">
                    <h2 style="text-align:center; color:#1abc9c;"><i class="fas fa-upload"></i> Tải File Lên Telegram</h2>
                    <form id="upload-form" onsubmit="event.preventDefault(); handleUpload(this);">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="file-upload-input" style="display:block; margin-bottom: 5px;">1. Chọn File:</label>
                            <input type="file" id="file-upload-input" name="file" required style="width: 100%; padding: 10px; border: 1px solid #ccc;">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="file-caption" style="display:block; margin-bottom: 5px;">2. Tiêu đề (Caption):</label>
                            <input type="text" id="file-caption" name="caption" class="form-control" placeholder="Tài liệu quan trọng..." style="width: 100%; padding: 10px; border: 1px solid #ccc;">
                        </div>
                        <button type="submit" style="width:100%; padding:12px; background:#1abc9c; color:white; border:none; cursor:pointer;">
                            Tải Lên (Upload)
                        </button>
                    </form>
                    <div id="upload-status" style="margin-top:20px; text-align:center;"></div>
                </div>
            `;
            return;
        }

        const response = await fetch(`content/${id}.html`);
        
        if (!response.ok) throw new Error(`File 'content/${id}.html' không được tìm thấy. Vui lòng kiểm tra tên file: content/${id}.html`);
        
        const html = await response.text();
        contentDisplay.innerHTML = `<div class="post-content">${html}</div>`;

    } catch (error) {
        contentDisplay.innerHTML = `<div style="padding:20px; color:red;">
            <h2>❌ Lỗi Tải Nội Dung</h2>
            <p><strong>Lý do:</strong> ${error.message}</p>
            <p>Vui lòng đảm bảo các file HTML nằm trong thư mục <code>content/</code> và tên file (ví dụ: <code>deploy.html</code>) khớp với tham số truyền vào (<code>'deploy'</code>).</p>
        </div>`;
        console.error(error);
    }
};


/* ===============================
      LOGIC DROPDOWN & KHỞI TẠO (ĐÃ SỬA)
================================*/

// Hàm xử lý việc hiển thị/ẩn dropdown (Cho Top Nav)
function toggleNavDropdown(event) {
    const clickedLink = event.target.closest('.nav-link');
    if (!clickedLink) return;

    // Ngăn sự kiện click link chính load trang
    event.preventDefault(); 
    
    const dropdownContainer = clickedLink.closest('.nav-dropdown');

    // 1. Đóng tất cả dropdown khác
    const allNavDropdowns = document.querySelectorAll('.nav-dropdown');
    allNavDropdowns.forEach(container => {
        if (container !== dropdownContainer && container.classList.contains('active-nav-dropdown')) {
            container.classList.remove('active-nav-dropdown');
        }
    });

    // 2. Toggle trạng thái hiện tại
    if (dropdownContainer) {
        dropdownContainer.classList.toggle('active-nav-dropdown');
    }
    
    // Ngăn sự kiện click truyền lên body để đóng ngay lập tức
    event.stopPropagation();
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Gắn sự kiện click cho các dropdown trên Nav
    const navContainer = document.querySelector('.top-nav .container');
    if (navContainer) {
        navContainer.addEventListener('click', toggleNavDropdown);
    }

    // 2. Đóng dropdown khi click vào mục con (và load nội dung)
    const allNavDropdownMenus = document.querySelectorAll('.dropdown-menu-nav');
    allNavDropdownMenus.forEach(menu => {
        menu.addEventListener('click', (event) => {
            const clickedMenuItem = event.target.closest('a');
            if (clickedMenuItem) {
                // Đóng menu sau khi click vào mục con
                clickedMenuItem.closest('.nav-dropdown').classList.remove('active-nav-dropdown');
                
                // Load content
                const onclickAttr = clickedMenuItem.getAttribute('onclick');
                if (onclickAttr) {
                    // Trích xuất hàm loadContent(id) và thực thi
                    // Ví dụ: onclick="loadContent('deploy')"
                    const idMatch = onclickAttr.match(/loadContent\(['"](.*?)['"]\)/);
                    if (idMatch && idMatch[1]) {
                        const title = getCleanText(clickedMenuItem);
                        loadContent(idMatch[1], title);
                    }
                }
            }
        });
    });

    // 3. Logic cho Sidebar menu (giữ nguyên)
    const guideMenu = document.getElementById('guide-menu');
    if (guideMenu) {
        guideMenu.addEventListener('click', (event) => {
            const clickedItem = event.target.closest('li');
            if (clickedItem) {
                const targetId = clickedItem.dataset.target;
                const title = getCleanText(clickedItem);
                loadContent(targetId, title);
            }
        });
    }
    
    // 4. Đóng dropdown khi click ra ngoài body
    document.body.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-dropdown')) {
            const activeDropdowns = document.querySelectorAll('.nav-dropdown.active-nav-dropdown');
            activeDropdowns.forEach(container => {
                container.classList.remove('active-nav-dropdown');
            });
        }
    });

    // 5. Khởi tạo trang mặc định
    loadContent('overview', 'Giới Thiệu Chung');

    window.triggerMenu = function(id) {
        loadContent(id);
    };
});