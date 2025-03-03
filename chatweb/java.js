document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");

    if (registerForm) setupRegistrationForm(registerForm);
    if (loginForm) setupLoginForm(loginForm);
    if (logoutBtn) setupLogoutButton(logoutBtn);
    if (window.location.pathname.endsWith("dashboard.html")) checkSession();

    // Setup toggle password visibility
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", function () {
            const passwordInput = this.previousElementSibling; // Lấy input ngay trước nó
            if (passwordInput && passwordInput.type === "password" || passwordInput.type === "text") {
                passwordInput.type = passwordInput.type === "password" ? "text" : "password";
                this.innerHTML = passwordInput.type === "password" ? '<i class="bx bx-show"></i>' : '<i class="bx bx-hide"></i>';
            }
        });
    });
});    
function setupRegistrationForm(form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const rememberMe = document.getElementById("rememberMe")?.checked || false;

        if (!validateInputs(username, email, password, confirmPassword)) return;

        let users = JSON.parse(localStorage.getItem("users")) || [];

        if (users.some(user => user.username === username || user.email === email)) {
            showAlert("Tên đăng nhập hoặc email đã tồn tại.", "error");
            return;
        }

        const { hash, salt } = await generateSecureHash(password);
        const newUser = { 
            username, 
            email, 
            hash, 
            salt,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            status: "active",
            profilePic: null
        };
        users.push({ username, email, hash, salt });
        localStorage.setItem("users", JSON.stringify(users));
        if (rememberMe) {
            const expiresAt = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 ngày
            localStorage.setItem("loggedInUser", JSON.stringify({ 
                username: newUser.username, 
                email: newUser.email, 
                expiresAt,
                rememberMe: true
            }));
        }

        showAlert("Đăng ký thành công! Đang chuyển hướng...", "success");
        setTimeout(() => window.location.href = "index.html", 1500);
    });
}

function setupLoginForm(form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("usernameInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const user = users.find(user => user.email === email);

        if (!user || !(await verifyPassword(password, user.hash, user.salt))) {
            showAlert("Email hoặc mật khẩu không đúng!", "error");
            return;
        }

        const expiresAt = new Date().getTime() + 30 * 60 * 1000;
        localStorage.setItem("loggedInUser", JSON.stringify({ username: user.username, email: user.email, expiresAt }));

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

async function generateSecureHash(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const derivedKey = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
    return {
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
        hash: Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('')
    };
}

async function verifyPassword(password, storedHash, storedSalt) {
    const saltBytes = new Uint8Array(storedSalt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const derivedKey = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
    const computedHash = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computedHash === storedHash;
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

function validateInputs(username, email, password, confirmPassword) {
    const usernameRegex = /^[a-zA-Z0-9_]{4,16}$/;
    const emailRegex = /^[a-zA-Z]+[0-9]+@gmail\.com$/;

    if (!usernameRegex.test(username)) {
        showAlert("Tên đăng nhập phải từ 4-16 ký tự, không chứa dấu cách và ký tự đặc biệt.", "error");
        return false;
    }

    if (!emailRegex.test(email)) {
        showAlert("Email không hợp lệ. Vui lòng kiểm tra lại.", "error");
        return false;
    }

    if (password.length < 8) {
        showAlert("Mật khẩu phải có ít nhất 8 ký tự.", "error");
        return false;
    }

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
