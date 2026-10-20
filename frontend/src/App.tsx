import { useState } from 'react'
import './App.css'
import { io } from 'socket.io-client';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const socket = io('http://localhost:3000');

  socket.on('result', (data: { id: string, text: string }) => {
    setResult(data.text);
  });

  const sendRequest = async (alg: string) => {
    try {
      const response = await fetch('http://localhost:3000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, algorithm: alg })
      });
      const data = await response.json();
      setResult(`Request sent with ID: ${data.id}`);
    } catch (e) {
      setResult('Connection error')
    }
  }

  return (
    <>
      <h1>React development is my passion</h1>
      <div style={{ display: 'flex', gap: '10px'}}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ padding: '5px', width: '200px', fontSize: '16px' }}
          placeholder='Write any message'
        />

        <button style={{ width: '200px' }} onClick={() => sendRequest('java')}>JAVA</button>
        <button style={{ width: '200px' }} onClick={() => sendRequest('csharp')}>C#</button>
        <div>{result}</div>
      </div>
    </>
  )
}

export default App
