const {
    requestSubdomainService,
    getMySubdomainRequestService,
    getPendingSubdomainRequestsService,
    fulfillSubdomainRequestService,
    rejectSubdomainRequestService,
} = require('./subdomainRequest.service');
const { sendSuccess, handleControllerError } = require('../../utils/response.utils');

const requestSubdomain = async (req, res) => {
    try {
        const result = await requestSubdomainService(req.user.schoolId, req.body.label);
        return sendSuccess(res, result.message, result, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getMySubdomainRequest = async (req, res) => {
    try {
        const result = await getMySubdomainRequestService(req.user.schoolId);
        return sendSuccess(res, 'Fetched', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getPendingSubdomainRequests = async (req, res) => {
    try {
        const rows = await getPendingSubdomainRequestsService();
        return sendSuccess(res, 'Fetched', rows);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const fulfillSubdomainRequest = async (req, res) => {
    try {
        const result = await fulfillSubdomainRequestService(req.params.id, req.user.id);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const rejectSubdomainRequest = async (req, res) => {
    try {
        const result = await rejectSubdomainRequestService(req.params.id);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = {
    requestSubdomain,
    getMySubdomainRequest,
    getPendingSubdomainRequests,
    fulfillSubdomainRequest,
    rejectSubdomainRequest,
};
