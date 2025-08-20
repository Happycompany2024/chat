const express = require('express');
const serverless = require('serverless-http');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const router = express.Router();

// 存储在线用户
const users = new Map();

// 创建 HTTP 服务器
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 用户加入聊天室
  socket.on('join', (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit('user joined', username);
    io.emit('users', Array.from(users.values()));
    console.log(`${username} 加入了聊天室`);
  });
  
  // 处理聊天消息
  socket.on('chat message', (message) => {
    const username = users.get(socket.id);
    console.log(`收到来自 ${username} 的消息: ${message}`);
    io.emit('chat message', { user: username, message: message });
  });
  
  // 用户断开连接
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      socket.broadcast.emit('user left', username);
      io.emit('users', Array.from(users.values()));
      console.log(`${username} 离开了聊天室`);
    }
    console.log('用户断开:', socket.id);
  });
});

// Express 路由
router.get('/', (req, res) => {
  res.json({ 
    message: '聊天功能正常运行!',
    timestamp: new Date().toISOString()
  });
});

router.post('/message', (req, res) => {
  res.json({ status: '消息已接收', timestamp: new Date().toISOString() });
});

app.use('/.netlify/functions/chat', router);

// 导出为 Netlify Function
exports.handler = serverless(app);
