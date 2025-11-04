import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Chat from "../models/Chat";
import Message from "../models/Message";
import mongoose, { ObjectId } from "mongoose";
import User from "../models/User";

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const chats = await Chat.find({ _id: { $in: req.user.chats } });
    res.status(200).json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const editChatName = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const chat = await Chat.findById(id);
    if (!chat) {
      res.status(400).json("Chat not found");
      return;
    }

    if (!name) {
      res.status(403).json("Name can`t be empty string");
      return;
    }
    
    if (!chat.isChatMode) {
      const message = await Message.create({
        sender: req.user._id,
        text: `Group ${name} created!`,
      });

      const newChat = await Chat.create({
        members: chat.members.map((memb) => {
          if (memb.user === req.user._id) {
            return { ...memb, role: "admin" };
          }

          return memb;
        }),
        name, // имя только для беседы
        messages: [message._id],
        isChatMode: true,
      });

      await User.updateMany(
        { _id: { $in: chat.members.map((el) => el.user) } },
        {
          $push: { chats: newChat._id },
        }
      );

      res.status(200).json(newChat);
      return;
    }

    await chat.updateOne({ name });
    await chat.save();
    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { users, isChatMode, name, message } = req.body;

    const firstMessage = await Message.create({
      sender: req.user._id,
      text: message,
    });

    // Формируем участников
    let members;
    if (isChatMode) {
      // Беседа: создающий — админ, остальные — обычные участники
      members = [
        { user: req.user._id, role: "admin" },
        ...users.map((u: string) => ({ user: u, role: "member" })),
      ];
    } else {
      // Диалог: просто два участника без роли
      members = [
        { user: req.user._id, role: "member" },
        { user: users[0], role: "member" },
      ];
    }
    

    const chat = await Chat.create({
      members,
      name: isChatMode ? name : undefined, // имя только для беседы
      messages: [firstMessage._id],
      isChatMode
    });

    await User.updateMany(
      { _id: { $in: [req.user._id, ...users] } },
      {
        $push: { chats: chat._id },
      }
    );

    return res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);
    const chat = await Chat.findOneAndDelete(objectId);
    await User.updateMany({ chats: id }, { $pull: { chats: id } });
    res.status(201).json(`Chat ${chat?._id} successfully deleted`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const addMemberToChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const chat = await Chat.findById(id);
    const user = await User.findById(memberId);

    if (!chat) {
      res.status(404).json(`Chat ${id} is not found`);
      return;
    }

    if (!user) {
      res.status(404).json(`User ${memberId} is not found`);
      return;
    }

    if (
      chat.members.find((member) => member.user._id.toString() === memberId)
    ) {
      res.status(403).json(`Person is already member of chat ${id}`);
      return;
    }

    if (!chat.isChatMode) {
      const message = await Message.create({
        sender: req.user._id,
        text: `Group created!`,
      });

      const newChat = await Chat.create({
        members: chat.members.map((memb) => {
          if (memb.user === req.user._id) {
            return { ...memb, role: "admin" };
          }

          return memb;
        }),
        messages: [message._id],
        isChatMode: true,
      });

      await User.updateMany(
        { _id: { $in: chat.members.map((el) => el.user) } },
        {
          $push: { chats: newChat._id },
        }
      );

      res.status(200).json(newChat);
      return;
    }

    await chat?.updateOne({
      members: [...chat.members, { user: memberId, role: "member" }],
    });
    await chat?.save();
    await user.updateOne({ chats: [...user.chats, chat._id] });
    await user?.save();

    res.status(200).json(`Person ${memberId} added`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
export const deleteMemberFromChat = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const chat = await Chat.findById(id);
    const user = await User.findById(memberId);

    if (!chat) {
      res.status(404).json(`Chat ${id} is not found`);
      return;
    }

    if (!user) {
      res.status(404).json(`User ${memberId} is not found`);
      return;
    }

    if (
      chat.members.find((member) => member.user._id.toString() === memberId)
    ) {
      await chat?.updateOne({
        members: chat.members.filter(
          (member) => member.user._id.toString() !== memberId
        ),
      });
      await chat?.save();
      await user.updateOne({
        chats: user.chats.filter((userChat) => userChat !== chat._id),
      });
      await user?.save();
      res.status(200).json(`Person ${memberId} deleted`);
    } else {
      res.status(403).json(`Person is not member of chat ${id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const changeMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const chat = await Chat.findById(id);
    const user = await User.findById(memberId);

    if (!chat) {
      res.status(404).json(`Chat ${id} is not found`);
      return;
    }

    if (!user) {
      res.status(404).json(`User ${memberId} is not found`);
      return;
    }

    if (!chat.isChatMode) {
      res.status(404).json(`Can't change role in dialoge`);
      return;
    }

    if (
      chat.members.find((member) => member.user._id.toString() === memberId)
    ) {
      await chat?.updateOne({
        members: chat.members.map((member) => {
          if (member.user._id.toString() === memberId) {
            return { ...member, role };
          }

          return member;
        }),
      });
      await chat?.save();
      res.status(200).json(`Person role of ${memberId} updated`);
    } else {
      res.status(403).json(`Person is not member of chat ${id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id);

    if (
      chat?.members.some(
        (user) => user.user.toString() === req.user._id.toString()
      )
    ) {
      const messages = await Message.find({ _id: { $in: chat.messages } });
      res.status(201).json(messages);
    } else {
      res.status(403).json(`Person is not member of chat ${id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const message = await Message.create({
      sender: req.user._id,
      text,
    });

    const chat = await Chat.findById(id);

    if (
      !chat?.members.some(
        (user) => user.user.toString() === req.user._id.toString()
      )
    ) {
      res.status(403).json(`Person is not member of chat ${id}`);

      return;
    }

    if (!message) {
      res.status(403).json(`Message wasn't created`);
      return;
    }

    await chat.updateOne({ messages: [...chat.messages, message._id] });
    await chat.save();
    res.status(201).json(`Successfully added message ${message._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const changeMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id: chatId, messageId } = req.params;
    const { text } = req.body;

    const chat = await Chat.findById(chatId);
    const message = await Message.findById(messageId);

    if (!chat || !message) {
      return res.status(404).json({ error: "Chat or message not found" });
    }

    const isMember = chat.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ error: `User is not a member of chat ${chatId}` });
    }

    const isInChat = chat.messages.some(
      // @ts-ignore
      (msgId) => msgId.toString() === message._id.toString()
    );

    if (!isInChat) {
      return res
        .status(403)
        .json({ error: `Message does not belong to chat ${chatId}` });
    }

    message.text = text;
    await message.save();

    return res.status(200).json({ message: "Message updated", data: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, messageId } = req.params;

    const message = await Message.findById(messageId);

    const chat = await Chat.findById(id);

    if (
      !chat?.members.some(
        (user) => user.user.toString() === req.user._id.toString()
      )
    ) {
      res.status(403).json(`Person is not member of chat ${id}`);

      return;
    }
    if (
        !chat.messages.some(
          // @ts-ignore
        (chatMessage) => chatMessage.toString() === message?._id.toString()
      )
    ) {
      res.status(403).json(`Message is not part of chat ${id}`);

      return;
    }

    await message?.deleteOne();
    await chat.updateOne({
      messages: chat.messages.filter(
        // @ts-ignore
        (chatMessage) => chatMessage.toString() !== message?._id.toString()
      ),
    });
    await chat.save();

    res.status(201).json(`Message ${messageId} deleted`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const readMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, messageId } = req.params;

    const message = await Message.findById(messageId);

    const chat = await Chat.findById(id);

    if (
      !chat?.members.some(
        (user) => user.user.toString() === req.user._id.toString()
      )
    ) {
      res.status(403).json(`Person is not member of chat ${id}`);

      return;
    }
    // @ts-ignore
    if (!chat.messages.some((chatMessage) => chatMessage.toString() === message?._id.toString())) {
      res.status(403).json(`Message is not part of chat ${id}`);

      return;
    }

    await message?.updateOne({ status: "read" });
    res.status(200).json(`Message ${message?._id} read`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
