import React from 'react'
import './Login.css'

const Login = () => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [status, setStatus] = React.useState('');
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Logging in...');
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if(!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            setStatus('Login successful!');
            localStorage.setItem("user",JSON.stringify(data.user));
            navigate('/dashboard');
        } catch (error) {
            setStatus(error.message);
        }
    }

function Login() {
  return (
    <div id='login'>
        <h1>Employee Management System</h1>
    <div className='container'>
        <form className='login-form'>
            <h1>Login </h1>
            <label htmlFor='username'>Username</label>
            <input type="text" id='username' placeholder='Username' />
            <label htmlFor='password'>Password</label>
            <input type="password" id='password' placeholder='Password' />
            <button type='submit' className="btn">Login</button>
            </form>
    </div>
    </div>
  )
}

export default Login