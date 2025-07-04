// React 로그인 연동 예시
import React, { useState } from 'react';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/login', {
        username: email,
        password: password
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      setToken(response.data.access_token);
      localStorage.setItem('token', response.data.access_token);
      alert('로그인 성공!');
    } catch (err) {
      alert('로그인 실패');
    }
  };

  return (
    <div>
      <h2>로그인</h2>
      <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} /><br />
      <button onClick={handleLogin}>로그인</button>
    </div>
  );
};

export default LoginPage;
