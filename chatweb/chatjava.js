let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
function loginUser(username) {
    const user = { username: username, expiresAt: new Date().getTime() + 3600000 }; // Ví dụ thời gian hết hạn là 1 giờ
    localStorage.setItem(`loggedInUser_${username}`, JSON.stringify(user));
}
function getLoggedInUser(username) {
    const user = JSON.parse(localStorage.getItem(`loggedInUser_${username}`));
    if (user && new Date().getTime() < user.expiresAt) {
        return user;
    }
    return null; // Nếu không có hoặc hết hạn
}

if (!loggedInUser || new Date().getTime() > loggedInUser.expiresAt) {
    // Hiển thị thông báo khi người dùng chưa đăng nhập hoặc phiên hết hạn
    const loginAlert = document.getElementById('loginAlert');
    loginAlert.style.display = 'block';

    // Chuyển hướng người dùng đến trang đăng nhập sau một thời gian
    setTimeout(() => {
        window.location.href = "index.html"; 
    }, 3000); // Chờ 3 giây trước khi chuyển hướng
} else {
    // Hiển thị tên người dùng sau khi đã đăng nhập
    document.getElementById('username').innerText = loggedInUser.username;
}

// Đóng thông báo khi người dùng nhấn nút "Đóng"
document.getElementById('closeAlert').addEventListener('click', () => {
    document.getElementById('loginAlert').style.display = 'none';
});


function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = "index.html";
}

document.getElementById('logoutButton').addEventListener('click', logout);

const commentInput = document.getElementById('commentInput');
const commentsList = document.getElementById('commentsList');
const sendButton = document.getElementById('sendButton');

function submitComment() {
    const commentText = commentInput.value;
    if (commentText.trim().length === 0) {
        return;
    }

    if (!loggedInUser) {
        const loginAlert = document.getElementById('loginAlert');
        loginAlert.style.display = 'block';
        setTimeout(() => {
            window.location.href = "index.html";
        }, 3000); // Chờ 3 giây trước khi chuyển hướng
        return;
    }

    let comments = JSON.parse(localStorage.getItem('comments')) || [];
    const newComment = { text: commentText, username: loggedInUser.username, isFavorite: false };
    comments.push(newComment);
    localStorage.setItem('comments', JSON.stringify(comments));

    displayComments();
    commentInput.value = '';
    commentsList.scrollTop = commentsList.scrollHeight;
}
console.log("Dữ liệu lưu trong localStorage:", JSON.parse(localStorage.getItem('comments')));

function displayComments() {
    const comments = JSON.parse(localStorage.getItem('comments')) || [];
    const userLiked = JSON.parse(localStorage.getItem('userLiked')) || {}; // Lưu trạng thái tim của user

    commentsList.innerHTML = ''; // Xóa tất cả bình luận hiện có

    comments.forEach((comment, index) => {
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('message');
        commentDiv.innerHTML = `<strong>${comment.username}:</strong> ${comment.text}`;

        // Nút thu hồi (chỉ hiển thị nếu là tin nhắn của chính mình)
        if (loggedInUser && comment.username === loggedInUser.username) {
            const revokeBtn = document.createElement('span');
            revokeBtn.classList.add('icon', 'revoke-btn');
            revokeBtn.innerHTML = '<i class="bx bx-undo"></i>';
            revokeBtn.title = 'Thu hồi tin nhắn';
            revokeBtn.addEventListener('click', () => confirmRevoke(index));
            commentDiv.appendChild(revokeBtn);
        }

        if (comment.favoriteCount === undefined) {
            comment.favoriteCount = 0;
        }

        let commentKey = `comment_${index}_${loggedInUser.username}`; // Mỗi user có trạng thái tim riêng
        let isUserLiked = userLiked[commentKey] ? true : false; // Kiểm tra user đã tim hay chưa

        // Nút thả tim
        const favoriteBtn = document.createElement('span');
        favoriteBtn.classList.add('favorite-btn');
        favoriteBtn.innerHTML = isUserLiked ? `❤️ ${comment.favoriteCount}` : `🤍 ${comment.favoriteCount}`;
        favoriteBtn.title = "Thả tim";
        favoriteBtn.addEventListener('click', () => toggleFavoriteMessage(index));

        commentDiv.appendChild(favoriteBtn);
        commentsList.appendChild(commentDiv);
    });

    // Cập nhật lại storage để tránh lỗi
    localStorage.setItem('comments', JSON.stringify(comments));
}

window.onload = function () {
    displayComments();
};

function toggleFavoriteMessage(index) {
    let comments = JSON.parse(localStorage.getItem('comments')) || [];
    let userLiked = JSON.parse(localStorage.getItem('userLiked')) || {}; // Lấy trạng thái tim riêng

    if (!comments[index]) return; // Kiểm tra tồn tại
    let comment = comments[index];

    if (comment.favoriteCount === undefined) {
        comment.favoriteCount = 0;
    }

    let commentKey = `comment_${index}_${loggedInUser.username}`;

    if (userLiked[commentKey]) {
        comment.favoriteCount--; // Nếu đã thả tim trước đó, giảm -1
        delete userLiked[commentKey]; // Xóa trạng thái của user
    } else {
        comment.favoriteCount++; // Nếu chưa tim, tăng +1
        userLiked[commentKey] = true; // Đánh dấu đã tim
    }

    // Lưu lại vào localStorage
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('userLiked', JSON.stringify(userLiked));

    displayComments();
}





function confirmRevoke(index) {
    if (confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) {
        revokeComment(index);
    }
}

function revokeComment(index) {
    let comments = JSON.parse(localStorage.getItem('comments')) || [];
    comments.splice(index, 1);
    localStorage.setItem('comments', JSON.stringify(comments));
    displayComments();
}

function addEmoji(emoji) {
    commentInput.value += emoji;
    commentInput.focus();
}

function autoEmoji() {
    const emojiMap = {
        ':)': '😊',
        ':D': '😄',
        ':P': '😛',
        ':O': '😲'
    };
    let text = commentInput.value;
    for (const [key, value] of Object.entries(emojiMap)) {
        text = text.replace(new RegExp(key, 'g'), value);
    }
    commentInput.value = text;
}

function checkEnter(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitComment();
    }
}

commentInput.addEventListener('keydown', checkEnter);

sendButton.addEventListener('click', submitComment);

window.onload = function() {
    displayComments(); 
};
