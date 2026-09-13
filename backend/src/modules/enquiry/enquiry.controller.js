const {
    submitEnquiryService,
    getEnquiriesService,
    updateEnquiryStatusService,
    deleteEnquiryService,
} = require('./enquiry.service');
const { sendSuccess, sendError, handleControllerError } = require('../../utils/response.utils');

const ENQUIRY_TYPES = ['admission', 'career'];
const STATUS_VALUES = ['new', 'contacted', 'closed'];

const submitEnquiry = async (req, res) => {
    try {
        const { type, name, email, phone, message, extra } = req.body;

        if (!ENQUIRY_TYPES.includes(type)) {
            return sendError(res, 'Invalid enquiry type', 400);
        }
        if (!name || !phone) {
            return sendError(res, 'Name and phone are required', 400);
        }

        const result = await submitEnquiryService(req.params.schoolId, { type, name, email, phone, message, extra });
        return sendSuccess(res, 'Enquiry submitted', result, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getEnquiries = async (req, res) => {
    try {
        const { type } = req.params;
        if (!ENQUIRY_TYPES.includes(type)) {
            return sendError(res, 'Invalid enquiry type', 400);
        }
        const rows = await getEnquiriesService(req.user.schoolId, type);
        return sendSuccess(res, 'Enquiries fetched', rows);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const updateEnquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!STATUS_VALUES.includes(status)) {
            return sendError(res, 'Invalid status', 400);
        }
        const result = await updateEnquiryStatusService(req.user.schoolId, req.params.uuid, status);
        return sendSuccess(res, 'Status updated', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const deleteEnquiry = async (req, res) => {
    try {
        const result = await deleteEnquiryService(req.user.schoolId, req.params.uuid);
        return sendSuccess(res, 'Enquiry deleted', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = {
    submitEnquiry,
    getEnquiries,
    updateEnquiryStatus,
    deleteEnquiry,
};
