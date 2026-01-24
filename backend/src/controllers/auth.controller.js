const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');
const EmailService = require('../services/email.service');

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: passwordHash,
                plan: 'free',
                name: name
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with OTP
        await supabase
            .from('users')
            .update({
                otp_code: otpCode,
                otp_expires_at: otpExpiresAt,
                is_verified: false
            })
            .eq('id', newUser.id);

        // Send Verification Email
        await EmailService.sendVerificationEmail(newUser.email, otpCode);

        // Do NOT send token yet
        res.status(201).json({
            requireVerification: true,
            email: newUser.email,
            message: 'Registration successful. Please check your email for verification code.'
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Email not verified', requireVerification: true, email: user.email });
        }

        const token = generateToken(user.id);

        // Audit Log
        const { logAction } = require('../services/audit.service');
        await logAction(user.id, 'USER_LOGIN');

        // Activity Log
        const ActivityLogService = require('../services/activity.service');
        await ActivityLogService.log(
            null, // No specific project for login
            user.id,
            'auth.login',
            `User logged in: ${user.email}`,
            'success',
            req.ip,
            {
                resource: '/auth/login',
                http_method: 'POST',
                http_status: 200,
                user_agent: req.headers['user-agent'],
                plan: user.plan
            }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
    res.json(req.user);
};

exports.verifyEmail = async (req, res) => {
    try {
        console.log('Verify Email Request Body:', req.body);
        const { code, email } = req.body; // Email is needed to find user if not authenticated

        if (!code || code.length !== 6) {
            return res.status(400).json({ error: 'Invalid code format' });
        }

        // Find user by email (if provided) or if we had a temporary session (not applicable here as we don't issue token)
        // We need email from frontend
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.is_verified) {
            return res.json({ success: true, message: 'Email already verified' });
        }

        if (user.otp_code !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (new Date(user.otp_expires_at) < new Date()) {
            return res.status(400).json({ error: 'Verification code expired' });
        }

        // Verify User
        await supabase
            .from('users')
            .update({
                is_verified: true,
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id);

        // Generate Token and Login
        const token = generateToken(user.id);

        // Send Welcome Email NOW (after verification)
        await EmailService.sendWelcomeEmail(user.email, user.name || 'User');

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
            success: true,
            message: 'Email verified successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan
            }
        });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.is_verified) {
            return res.json({ success: true, message: 'Email already verified' });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with OTP
        const { error } = await supabase
            .from('users')
            .update({
                otp_code: otpCode,
                otp_expires_at: otpExpiresAt
            })
            .eq('id', user.id);

        if (error) throw error;

        // Send Verification Email
        await EmailService.sendVerificationEmail(user.email, otpCode);

        res.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification code' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    // Check if user exists
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();

    if (!user) {
        return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Generate reset token (JWT or random string)
    const resetToken = generateToken(user.id); // Short lived token
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordResetEmail(email, resetLink);

    res.json({ success: true, message: 'Reset link sent to your email.' });
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const userId = decoded.id;

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update password in DB and verify user
        const { error } = await supabase
            .from('users')
            .update({
                password_hash: passwordHash,
                is_verified: true // Auto-verify since they have email access
            })
            .eq('id', userId);

        if (error) throw error;

        // Audit Log
        const { logAction } = require('../services/audit.service');
        await logAction(userId, 'USER_PASSWORD_RESET');

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        console.log('Google Login Request Body:', req.body);
        const { token } = req.body;

        if (!token) {
            console.log('Token missing in request');
            return res.status(400).json({ error: 'Token required' });
        }

        // Verify token and get user info from Google
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            console.log('Google UserInfo failed:', response.status, response.statusText);
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const googleUser = await response.json();
        console.log('Google User Info:', googleUser);

        const { email, name, sub: googleId, picture: avatar } = googleUser;

        if (!email) {
            console.log('Email missing in Google User Info');
            return res.status(400).json({ error: 'Email required from Google' });
        }

        // Check if user exists
        let { data: user } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},google_id.eq.${googleId}`)
            .single();

        if (user) {
            // Update google_id if missing
            if (!user.google_id) {
                await supabase.from('users').update({ google_id: googleId, is_verified: true }).eq('id', user.id);
            }
        } else {
            // Create new user
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    email,
                    name,
                    google_id: googleId,
                    avatar_url: avatar,
                    is_verified: true, // Google emails are verified
                    plan: 'free',
                    password_hash: 'google_auth' // Placeholder
                })
                .select()
                .single();

            if (error) throw error;
            user = newUser;

            // Send Welcome Email for new Google users
            await EmailService.sendWelcomeEmail(user.email, user.name || 'User');
        }

        const jwtToken = generateToken(user.id);

        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
                avatar: user.avatar_url
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Google login failed' });
    }
};
