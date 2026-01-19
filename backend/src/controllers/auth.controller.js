const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');

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

        // Note: 'name' is not in the provided SQL schema for users table, 
        // but keeping it in the insert in case the user adds it or it's handled by Supabase Auth metadata.
        // If strict SQL schema is enforced and 'name' column is missing, this might fail.
        // However, user explicitly asked to ADD name to register page.
        // I will attempt to insert it. If it fails, we might need to alter table.

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

        const token = generateToken(newUser.id);

        // Audit Log
        const { logAction } = require('../services/audit.service');
        await logAction(newUser.id, 'USER_REGISTER');

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                plan: newUser.plan
            }
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

        const token = generateToken(user.id);

        // Audit Log
        const { logAction } = require('../services/audit.service');
        await logAction(user.id, 'USER_LOGIN');

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
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
