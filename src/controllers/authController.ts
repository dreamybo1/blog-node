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
      isEmailSent: true,
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
    res.json({ message: "Почта подтверждена" });
  } catch (err) {
    res.status(400).json({ message: "Неверный или просроченный токен" });
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
