import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const returnUrl = router.query.returnUrl || '/dashboard';
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'mobile'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
    otp: '',
    rememberMe: false,
    acceptTerms: false
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const testimonials = [
    {
      text: "Interactive Video Campaigns has transformed how we collect customer feedback. The platform is intuitive and powerful.",
      image: "https://i.pinimg.com/236x/70/9e/57/709e574de051258a80745a745163acfb.jpg"
    },
    {
      text: "Creating engaging video campaigns has never been easier. Our response rates have increased by 300%!",
      image: "https://i.pinimg.com/736x/a3/e3/11/a3e311abe61ffe88653cec16b45f051f.jpg"
    },
    {
      text: "The best tool for async interviews and lead qualification. It saves us hours every week.",
      image: "https://i.pinimg.com/736x/c8/5e/a5/c85ea5f0a0cc23c1f8b21ca769c40a57.jpg"
    },
    {
      text: "We use this for all our customer onboarding flows. The analytics are incredibly detailed and helpful.",
      image: "https://i.pinimg.com/236x/4e/79/9a/4e799a1440f4d908af1b8cd3f69505fb.jpg"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      router.push(returnUrl);
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileOTPRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneNumber = formData.countryCode + formData.mobile;
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
      });

      if (error) throw error;

      setOtpSent(true);
      alert('OTP sent to your mobile number!');
    } catch (error) {
      alert('Failed to send OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileOTPVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneNumber = formData.countryCode + formData.mobile;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: formData.otp,
        type: 'sms'
      });

      if (error) throw error;

      router.push(returnUrl);
    } catch (error) {
      alert('OTP verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (!formData.acceptTerms) {
      alert('Please accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            mobile_number: formData.countryCode + formData.mobile
          }
        }
      });

      if (error) throw error;

      alert('Account created! Please check your email to verify your account.');
      setIsLogin(true);
    } catch (error) {
      alert('Signup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error) {
      alert('Google login failed: ' + error.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error) {
      alert('Apple login failed: ' + error.message);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#059669'];

    return {
      strength: (strength / 4) * 100,
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || '#ef4444'
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <>
      <Head>
        <title>{isLogin ? 'Login' : 'Sign Up'} - Interactive Video Platform</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <div className="min-h-screen w-full flex items-center justify-center bg-gray-200">
        <section className="flex max-h-[480px] min-h-[480px] h-[90vh] max-w-[800px] w-[90vw] overflow-hidden shadow-2xl">
          {/* Left Side - Testimonial Slider */}
          <div className="flex-1 h-full relative hidden md:block">
            <img
              src="https://i.pinimg.com/736x/cb/20/60/cb206047101b354898b36e564a33cc65.jpg"
              alt="logo"
              className="absolute top-5 left-5 z-10 w-10 brightness-0 invert"
            />

            <div className="w-full h-full relative">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    currentSlide === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={testimonial.image}
                    alt={`Testimonial ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover blur-sm brightness-90 -z-10"
                  />

                  <div className="relative h-full flex flex-col justify-center items-center px-12 text-white">
                    <h1 className="text-xl leading-relaxed text-center mb-auto mt-32">
                      {testimonial.text}
                    </h1>

                    <div className="flex justify-end gap-2 w-full mb-12">
                      <button
                        onClick={prevSlide}
                        className="border border-white/70 opacity-70 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-100 transition"
                      >
                        ←
                      </button>
                      <button
                        onClick={nextSlide}
                        className="border border-white/70 opacity-70 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-100 transition"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login/Signup Form */}
          <div className="w-full md:w-[300px] h-full pt-20 bg-white px-6 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <small className="text-gray-600 text-sm block mb-6">
              {isLogin ? 'Login to continue' : "Let's get started with your 30 days free trial."}
            </small>

            {/* Login/Signup Forms */}
            {isLogin ? (
              <form onSubmit={loginMethod === 'email' ? handleEmailLogin : (otpSent ? handleMobileOTPVerify : handleMobileOTPRequest)} className="flex flex-col gap-3">
                {/* Login Method Toggle */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('email'); setOtpSent(false); }}
                    className={`flex-1 py-2 text-xs rounded-lg transition ${
                      loginMethod === 'email' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('mobile'); setOtpSent(false); }}
                    className={`flex-1 py-2 text-xs rounded-lg transition ${
                      loginMethod === 'mobile' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                {loginMethod === 'email' ? (
                  <>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                    />
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                        />
                        <span>Remember me</span>
                      </label>
                      <a href="#" className="text-blue-600 hover:underline">Forgot Password?</a>
                    </div>
                  </>
                ) : (
                  <>
                    {!otpSent ? (
                      <div className="flex gap-2">
                        <select
                          value={formData.countryCode}
                          onChange={(e) => handleInputChange('countryCode', e.target.value)}
                          className="w-20 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="Mobile Number"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          required
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={(e) => handleInputChange('otp', e.target.value)}
                        maxLength={6}
                        required
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                      />
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 text-sm font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : (otpSent ? 'Verify OTP' : 'Login')}
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-xs text-gray-500">or</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/300/300221.png" alt="Google" className="w-4 h-4" />
                  Sign in with Google
                </button>

                <button
                  type="button"
                  onClick={handleAppleLogin}
                  className="w-full py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <i className="fab fa-apple text-lg"></i>
                  Sign in with Apple
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSignup} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                />

                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => handleInputChange('countryCode', e.target.value)}
                    className="w-20 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                {formData.password && (
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <p className="text-xs" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none"
                />

                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>I accept the <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a></span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 text-sm font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-xs text-gray-500">or</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/300/300221.png" alt="Google" className="w-4 h-4" />
                  Sign up with Google
                </button>

                <button
                  type="button"
                  onClick={handleAppleLogin}
                  className="w-full py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <i className="fab fa-apple text-lg"></i>
                  Sign up with Apple
                </button>
              </form>
            )}

            <div className="flex justify-center gap-1 mt-4 text-xs text-gray-600">
              <p>{isLogin ? "Don't have an account?" : "Already have an account?"}</p>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </div>
        </section>

        <style jsx>{`
          @media (max-width: 650px) {
            section {
              width: 300px;
            }
            section > div:first-child {
              display: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}
