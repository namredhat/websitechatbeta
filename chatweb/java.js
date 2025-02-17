document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form");
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");
    const togglePassword = document.querySelector(".toggle-password");

    if (registerForm) {
        setupRegistrationForm(registerForm);
    }

    if (loginForm) {
        setupLoginForm(loginForm);
    }

    if (logoutBtn) {
        setupLogoutButton(logoutBtn);
    }

    if (togglePassword) {
        setupPasswordToggle(togglePassword);
    }

    if (window.location.pathname.endsWith("dashboard.html")) {
        checkSession();
    }
});

function setupRegistrationForm(form) {
    const usernameInput = document.getElementById("registerUsername");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!validateInputs(username, email, password, confirmPassword)) return;

        let users = JSON.parse(localStorage.getItem("users")) || [];

        if (users.some(user => user.username === username || user.email === email)) {
            showAlert("Tên đăng nhập hoặc email đã tồn tại.", "error");
            return;
        }

        const hashedPassword = await hashPassword(password);
        users.push({ username, email, password: hashedPassword });
        localStorage.setItem("users", JSON.stringify(users));

        showAlert("Đăng ký thành công! Đang chuyển hướng...", "success");
        setTimeout(() => window.location.href = "index.html", 1500);
    });
}

function setupLoginForm(form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("usernameInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const hashedPassword = await hashPassword(password);
        const user = users.find(user => user.email === email && user.password === hashedPassword);

        if (!user) {
            showAlert("Email hoặc mật khẩu không đúng!", "error");
            return;
        }

        const expiresAt = new Date().getTime() + 30 * 60 * 1000;
        localStorage.setItem("loggedInUser", JSON.stringify({ ...user, expiresAt }));

        showAlert("✅ Đăng nhập thành công!", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1500);
    });
}

function setupLogoutButton(button) {
    button.addEventListener("click", function () {
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem("loggedInUser");
            showAlert("✅ Đăng xuất thành công!", "success");
            setTimeout(() => window.location.href = "index.html", 1500);
        }
    });
}

function checkSession() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser || new Date().getTime() > loggedInUser.expiresAt) {
        showAlert("Phiên đăng nhập đã hết hạn!", "error");
        localStorage.removeItem("loggedInUser");
        setTimeout(() => window.location.href = "index.html", 1500);
    } else {
        document.getElementById("welcomeMessage").innerText = `Xin chào, ${loggedInUser.username}!`;
    }
}

function setupPasswordToggle(button, passwordInputId) {
    const passwordInput = document.getElementById(passwordInputId);
    
    if (passwordInput) {
        button.addEventListener("click", function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                this.innerHTML = '<i class="bx bx-hide"></i>';
            } else {
                passwordInput.type = "password";
                this.innerHTML = '<i class="bx bx-show"></i>';
            }
        });
    } else {
        console.error(`Không tìm thấy input với ID ${passwordInputId}`);
    }
}

// Thiết lập toggle cho các input mật khẩu
document.addEventListener("DOMContentLoaded", function() {
    const passwordToggles = document.querySelectorAll(".toggle-password");

    if (passwordToggles.length > 0) {
        // Cập nhật sự kiện toggle cho các input mật khẩu
        setupPasswordToggle(passwordToggles[0], "registerPassword");
        setupPasswordToggle(passwordToggles[1], "confirmPassword");
    }
});



function validateInputs(username, email, password, confirmPassword) {
    const usernameRegex = /^[a-zA-Z0-9_]{4,16}$/;
    const emailRegex = /^[a-zA-Z]+[0-9]+@gmail\.com$/;

    // Kiểm tra tên đăng nhập
    if (!usernameRegex.test(username)) {
        showAlert("Tên đăng nhập phải từ 4-16 ký tự, không chứa dấu cách và ký tự đặc biệt.", "error");
        return false;
    }

    // Kiểm tra email
    if (!emailRegex.test(email)) {
        showAlert("Email không hợp lệ. Vui lòng kiểm tra lại.", "error");
        return false;
    }

    // Kiểm tra mật khẩu
    if (password.length < 8) {
        showAlert("Mật khẩu phải có ít nhất 8 ký tự.", "error");
        return false;
    }

    // Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
        showAlert("Mật khẩu xác nhận không trùng khớp.", "error");
        return false;
    }

    return true;
}


async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function showAlert(message, type) {
    const alertBox = document.createElement("div");
    alertBox.textContent = message;
    alertBox.classList.add("alert", type);

    const existingAlert = document.querySelector(".alert");
    if (existingAlert) existingAlert.remove();

    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.style.animation = "fadeOut 0.5s ease-in-out";
        setTimeout(() => alertBox.remove(), 500);
    }, 3000);
}


