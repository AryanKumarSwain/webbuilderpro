const { createOrderService, verifyPaymentService, handleWebhookService } = require('./billing.service');
const { sendSuccess, handleControllerError } = require('../../utils/response.utils');

const createOrder = async (req, res) => {
    try {
        const order = await createOrderService(req.user.schoolId, req.body.planId);
        return sendSuccess(res, 'Order created', order, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const verifyPayment = async (req, res) => {
    try {
        const result = await verifyPaymentService(req.user.schoolId, req.body);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// Razorpay's server calls this — no user session. `req.rawBody` is stashed by
// the express.json() verify hook in app.js so the HMAC can be checked against
// the exact bytes received.
const handleWebhook = async (req, res) => {
    try {
        const result = await handleWebhookService(req.rawBody, req.headers['x-razorpay-signature']);
        return sendSuccess(res, 'Webhook processed', result);
    } catch (error) {
        console.error('[billing] webhook failed:', error.message);
        return handleControllerError(res, error);
    }
};

module.exports = { createOrder, verifyPayment, handleWebhook };
