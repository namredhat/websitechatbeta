from flask import Flask, request, jsonify, url_for, render_template
from flask_mail import Mail, Message
from flask_cors import CORS
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import os
import logging
from dotenv import load_dotenv


# Load biến môi trường
load_dotenv()

app = Flask(__name__)
CORS(app)  # Cho phép CORS

# Cấu hình logging
logging.basicConfig(level=logging.INFO)

# Cấu hình Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_USERNAME")

mail = Mail(app)

# Cấu hình bảo mật token
SECRET_KEY = os.getenv("SECRET_KEY")
s = URLSafeTimedSerializer(SECRET_KEY)

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"message": "Vui lòng nhập email!"}), 400

    try:
        # Tạo token reset mật khẩu
        token = s.dumps(email, salt="reset-password")
        reset_url = url_for('reset_with_token', token=token, _external=True)

        # Gửi email
        msg = Message("Đặt lại mật khẩu", recipients=[email])
        msg.body = f"Nhấp vào link sau để đặt lại mật khẩu: {reset_url}"
        mail.send(msg)

        logging.info(f"Email đặt lại mật khẩu đã gửi đến {email}")

        return jsonify({"message": "Email đặt lại mật khẩu đã được gửi!"}), 200
    except Exception as e:
        logging.error(f"Lỗi khi gửi email: {str(e)}")
        return jsonify({"message": "Lỗi khi gửi email!", "error": str(e)}), 500

@app.route('/reset-password/<token>', methods=['GET'])
def reset_with_token(token):
    try:
        email = s.loads(token, salt="reset-password", max_age=1800)  
        return render_template("reset_password.html", email=email, token=token)
    except SignatureExpired:
        return jsonify({"message": "Token đã hết hạn!"}), 400
    except BadSignature:
        return jsonify({"message": "Token không hợp lệ!"}), 400

@app.route('/update-password', methods=['POST'])
def update_password():
    data = request.json
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({"message": "Thiếu dữ liệu!"}), 400

    try:
        email = s.loads(token, salt="reset-password", max_age=1800)

        # TODO: Cập nhật mật khẩu trong database (giả lập)
        logging.info(f"Mật khẩu mới của {email} đã được cập nhật!")

        return jsonify({"message": "Mật khẩu đã được cập nhật!"}), 200
    except SignatureExpired:
        return jsonify({"message": "Token đã hết hạn!"}), 400
    except BadSignature:
        return jsonify({"message": "Token không hợp lệ!"}), 400

# Khởi chạy ứng dụng Flask
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
