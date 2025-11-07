import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";

// Регистрация
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "1d",
      }
    );
    const verifyLink = `${process.env.CLIENT_URL}/verify/${token}`;

    await sendEmail(
      email,
      "Подтверждение почты",
      `
      <h2>Подтвердите вашу почту</h2>
      <p>Перейдите по ссылке:</p>
      <a href="${verifyLink}">${verifyLink}</a>
    `
    );

    res
      .status(201)
      .json(
        "User registered successfully. Please check your email to verify your account."
      );
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ✅ Подтверждение email
export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const decoded = jwt.verify(
      req.params.token,
      process.env.JWT_SECRET || "secret"
    ) as { id: string };

    if (decoded?.id && typeof decoded?.id === "string") {
      await User.findByIdAndUpdate(decoded.id, {
        isVerified: true,
      });
    } else {
      return res.status(400).json("Invalid token data");
    }

    const newToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.send(`
      <html lang="ru">
        <head>
          <meta charset="UTF-8" />
          <title>Подтверждение почты</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              background-color: #f7f7f7;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              color: #333;
              text-align: center;
            }
            .box {
              background: white;
              padding: 40px 60px;
              border-radius: 16px;
              box-shadow: 0 6px 16px rgba(0,0,0,0.1);
            }
            .spinner {
              margin-top: 16px;
              border: 4px solid #eee;
              border-top: 4px solid #6B32E7;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Почта успешно подтверждена ✅</h2>
            <p>Вы будете перенаправлены на главную через 3 секунды...</p>
            <div class="spinner"></div>
          </div>

          <script>
            // Сохраняем токен в localStorage
            localStorage.setItem("token", "${newToken}");
            
            // Редирект через 3 секунды
            setTimeout(() => {
              window.location.href = "${process.env.CLIENT_URL}";
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    return res.status(400).send(`
      <html lang="ru">
        <head>
          <meta charset="UTF-8" />
          <title>Ошибка подтверждения</title>
        </head>
        <body style="font-family:sans-serif;text-align:center;margin-top:100px">
          <h2 style="color:red;">Неверный или просроченный токен 😢</h2>
          <p>Попробуйте запросить новое письмо с подтверждением.</p>
        </body>
      </html>
    `);
  }
};

// Вход
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

// Получить текущего пользователя
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching user" });
  }
};

// 🧠 Забыли пароль
export const forgotPassword = async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Пользователь не найден" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "1h",
  });
  const resetLink = `${process.env.CLIENT_URL}/reset/${token}`;

  await sendEmail(
    email,
    "Восстановление пароля",
    `
    <h2>Сброс пароля</h2>
    <p>Перейдите по ссылке, чтобы изменить пароль:</p>
    <a href="${resetLink}">${resetLink}</a>
  `
  );

  res.json({ message: "Письмо для восстановления отправлено" });
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const decoded = jwt.verify(
      req.params.token,
      process.env.JWT_SECRET || "secret"
    ) as { id: string };
    const hashed = await bcrypt.hash(req.body.password, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashed });
    res.json({ message: "Пароль успешно изменён" });
  } catch (err) {
    res.status(400).json({ message: "Неверный или просроченный токен" });
  }
};
