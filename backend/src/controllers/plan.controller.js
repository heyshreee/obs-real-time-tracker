const planService = require('../services/plan.service');

exports.getPlans = async (req, res) => {
    try {
        const plans = await planService.getAllPlans();
        res.json(plans);
    } catch (error) {
        console.error('Error in getPlans controller:', error);
        res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
};
