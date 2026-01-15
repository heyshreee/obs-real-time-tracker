const { verifyToken } = require('../utils/jwt');
const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = verifyToken(token);

        const { data: user } = await supabase
            .from('users')
            .select('id, email, subscription_tier')
            .eq('id', decoded.id)
            .single();

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
