const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validators');
const { v4: uuidv4 } = require('uuid');

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
        const trackingCode = 'obs_' + Math.random().toString(36).substr(2, 9);
        const apiKey = 'key_' + uuidv4().replace(/-/g, '');

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: passwordHash,
                name,
                tracking_code: trackingCode,
                api_key: apiKey
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        const token = generateToken(newUser.id);

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                trackingCode: newUser.tracking_code
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

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                trackingCode: user.tracking_code,
                subscriptionTier: user.subscription_tier
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.getMe = async (req, res) => {
    res.json(req.user);
};
