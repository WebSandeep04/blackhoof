<!DOCTYPE html>
<html>
<head>
    <title>Reset Password OTP</title>
</head>
<body>
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password. Use the following OTP to proceed:</p>
    <h3 style="background-color: #f3f4f6; padding: 10px; display: inline-block; border-radius: 5px; font-size: 24px; letter-spacing: 2px;">
        {{ $otp }}
    </h3>
    <p>If you did not request a password reset, please ignore this email.</p>
</body>
</html>
