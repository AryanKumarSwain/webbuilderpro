const {
    getActivePlansService,
    getAllPlansService,
    createPlanService,
    updatePlanService,
    deletePlanService,
} = require('./plans.service');
const { sendSuccess, handleControllerError } = require('../../utils/response.utils');

const getActivePlans = async (req, res) => {
    try {
        const plans = await getActivePlansService();
        return sendSuccess(res, 'Plans fetched', plans);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getAllPlans = async (req, res) => {
    try {
        const plans = await getAllPlansService();
        return sendSuccess(res, 'All plans fetched', plans);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const createPlan = async (req, res) => {
    try {
        const plan = await createPlanService(req.body);
        return sendSuccess(res, 'Plan created', plan, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const updatePlan = async (req, res) => {
    try {
        const plan = await updatePlanService(req.params.id, req.body);
        return sendSuccess(res, 'Plan updated', plan);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const deletePlan = async (req, res) => {
    try {
        const result = await deletePlanService(req.params.id);
        return sendSuccess(res, result.message, result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = { getActivePlans, getAllPlans, createPlan, updatePlan, deletePlan };
