import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        try {
            await dispatch(loginUser({ email: loginEmail, password: loginPassword })).unwrap();
            navigate('/admin');
        } catch (err) {
            setLoginError(err.message || err || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl h-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex">

                {/* --- Sign In Panel (Left side in DOM, slides right) --- */}
                <div className={`absolute top-0 left-0 h-full w-1/2 p-8 transition-all duration-700 ease-in-out flex flex-col justify-center ${isRightPanelActive ? 'translate-x-full opacity-0 z-0' : 'translate-x-0 opacity-100 z-10'}`}>
                    <h1 className="text-3xl font-bold text-center text-[#2bb69a] mb-6">Sign In</h1>

                    {loginError && <p className="text-red-500 text-sm text-center mb-4">{loginError}</p>}

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#2bb69a] outline-none"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#2bb69a] outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <a href="#" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-2">Forgot your password?</a>
                        <button type="submit" disabled={loading} className="w-full bg-[#2bb69a] text-white rounded-full py-3 font-bold uppercase tracking-wider hover:bg-[#259b83] transition mt-4 disabled:opacity-50">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* --- Sign Up Panel (Right side in DOM, slides left) --- */}
                <div className={`absolute top-0 left-0 h-full w-1/2 p-8 transition-all duration-700 ease-in-out flex flex-col justify-center ${isRightPanelActive ? 'translate-x-full opacity-100 z-10' : 'translate-x-0 opacity-0 z-0 pointer-events-none'}`}>
                    <h1 className="text-3xl font-bold text-center text-[#2bb69a] mb-6">Create Account</h1>
                    <div className="flex justify-center gap-4 mb-4">
                        <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">f</button>
                        <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">G+</button>
                        <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold">in</button>
                    </div>
                    <p className="text-center text-gray-500 mb-6">or use your email for registration</p>

                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Registration is currently disabled.'); }}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" placeholder="Name" required className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#2bb69a] outline-none" />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="email" placeholder="Email" required className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#2bb69a] outline-none" />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="password" placeholder="Password" required className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#2bb69a] outline-none" />
                        </div>
                    </form>
                </div>

                {/* --- Overlay Container --- */}
                <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-20 ${isRightPanelActive ? '-translate-x-full' : ''}`}>
                    <div className={`bg-gradient-to-br from-[#3bceb3] to-[#2bb69a] relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}`}>

                        {/* Overlay Left (Sign In side) */}
                        <div className={`absolute top-0 w-1/2 h-full flex flex-col items-center justify-center p-8 text-center text-white transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'}`}>
                            <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
                            <p className="text-base mb-6 text-white/90">To keep connected with us please login with your personal info</p>
                            <button
                                onClick={() => setIsRightPanelActive(false)}
                                className="border-2 border-white text-white rounded-full py-3 px-12 font-bold uppercase tracking-wider hover:bg-white hover:text-[#2bb69a] transition"
                            >
                                Sign In
                            </button>
                        </div>

                        {/* Overlay Right (Sign Up side) */}
                        <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center p-8 text-center text-white transition-transform duration-700 ease-in-out ${isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'}`}>
                            <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
                            <p className="text-base mb-6 text-white/90">Enter your personal details and start journey with us</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background shapes (optional aesthetics based on image) */}
            <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-red-400 rounded-bl-full opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-yellow-400 rounded-tr-full opacity-40 transform -translate-x-1/4 translate-y-1/4"></div>
        </div>
    );
}
