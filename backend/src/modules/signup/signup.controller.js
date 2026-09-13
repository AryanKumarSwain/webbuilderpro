const { createSignupRequestService } = require('./signup.service');
const { sendSuccess, handleControllerError } = require('../../utils/response.utils');

const createSignupRequest = async (req, res) => {
    try {
        const result = await createSignupRequestService(req.body);
        return sendSuccess(res, 'Signup request submitted — awaiting approval', result, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = { createSignupRequest };
