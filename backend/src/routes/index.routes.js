const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const superAdminRoutes = require('../modules/superAdmin/superAdmin.routes');
const schoolRoutes = require('../modules/school/school.routes');
const contentRoutes = require('../modules/content/content.routes');
const enquiryRoutes = require('../modules/enquiry/enquiry.routes');
const signupRoutes = require('../modules/signup/signup.routes');
const plansRoutes = require('../modules/plans/plans.routes');
const billingRoutes = require('../modules/billing/billing.routes');
const subdomainRequestRoutes = require('../modules/subdomainRequest/subdomainRequest.routes');

router.use('/auth', authRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/school', schoolRoutes);
router.use('/content', contentRoutes);
router.use('/enquiry', enquiryRoutes);
router.use('/signup', signupRoutes);
router.use('/plans', plansRoutes);
router.use('/billing', billingRoutes);
router.use('/subdomain-requests', subdomainRequestRoutes);

module.exports = router;