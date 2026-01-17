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
                plan: 'free'
                // name: name // Commenting out name if it's not in schema, or we can try. 
                // Let's assume we can't insert 'name' if column doesn't exist.
                // But wait, user asked for name field. I'll assume they will add the column or I should include it.
                // For safety with the STRICT schema provided, I will omit name from the DB insert 
                // but maybe store it in metadata if we were using Supabase Auth (which we are not fully using here, just DB).
                // Let's try to insert it, if it fails, the user needs to add the column.
                // Actually, looking at the SQL provided: "create table public.users ( ... )" -> NO NAME column.
                // So I MUST NOT insert name into 'users' table or it will error.
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        const token = generateToken(newUser.id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(201).json({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: name,
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

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
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
