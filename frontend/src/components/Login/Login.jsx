import React from 'react'
import './Login.css'

function Login() {
  return (
    <>
      <div id='login' className='login'>
        <h1>Employee Management System</h1>
      <div className='container'>
        <form className='login-form'>
            <h1>Login</h1>
            <label htmlFor='username'>Username</label>
            <input type="text" id='username' placeholder='Username' />
            <label htmlFor='password'>Password</label>
            <input type="password" id='password' placeholder='Password' />
            <button type='submit' className="btn">Login</button>
            <p> Click here to <span> sign up</span></p>
            </form>
         </div>
      </div>
    </>
  );
}
export default Login;