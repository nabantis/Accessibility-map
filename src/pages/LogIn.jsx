import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LogIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogIn = async () => {
        const {error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
         if (error) {
            alert(error.message)
        } else {
            navigate('/map')  // Context updates automatically
        }
    }

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '24px',
            }}
        >
            <div
                style={{
                    padding: '40px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    position: 'relative',
                    alignContent: 'center',
                    flexDirection: 'column',
                    gap: '15px',
                    minWidth: '320px',
                    maxWidth: '460px',
                    width: '100%',
                    background: 'var(--surface)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    color: 'var(--text)'
                }}
            >
                <h2 style={{ textAlign: 'center', margin: 0 }}>Log In</h2>
                <label htmlFor="login-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Email address</label>
                <input
                        id="login-email"
                        type='email'
                        placeholder='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text)'
                        }}
                />

                <label htmlFor="login-password" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Password</label>
                <input
                        id="login-password"
                        type='password'
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text)'
                        }}
                />

                <button
                    onClick={handleLogIn}
                    style={{
                        padding: '12px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >Log In</button>
            </div>
            <div style={{
                color: 'var(--muted)',
                marginTop: '14px'
            }}>
                Don't have an account
                <button
                    style={{
                        background: 'none',
                        marginLeft: '5px',
                        padding: '0',
                        color: 'var(--accent)',
                        textDecoration: 'underline',
                        border: '0',
                        marginTop: '0'
                    }}
                    onClick={() => {navigate('/signUp')}}
                    aria-label="Sign up for a new account"
                > Sign Up</button>
            </div>
        </div>
    )
}
