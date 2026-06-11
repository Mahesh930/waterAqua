const Referral = require('../models/Referral');
const User = require('../models/User');

// @desc    Get user referral details and history
// @route   GET /api/v1/referrals
// @access  Private
exports.getReferralDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('referralCode');
    
    // Find all referrals made by this user
    const referrals = await Referral.find({ referrer: req.user.id })
      .populate('referred', 'name email createdAt')
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const pendingReferrals = totalReferrals - completedReferrals;
    const totalEarned = referrals
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    res.success({
      referralCode: user ? user.referralCode : null,
      stats: {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalEarned
      },
      referrals
    });
  } catch (error) {
    next(error);
  }
};
