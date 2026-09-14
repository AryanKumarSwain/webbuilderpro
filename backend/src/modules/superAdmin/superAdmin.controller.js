const {
    createSchoolService,
    getAllSchoolsService,
    getSchoolByUuidService,
    updateSchoolStatusService,
    deleteSchoolService,
    createAdminService,
    updateAdminStatusService,
    createSchoolWithAdminService,
    getDashboardStatsService,
} = require('./superAdmin.service');
const { sendSuccess, handleControllerError } = require('../../utils/response.utils');

const createSchool = async (req, res) => {
    try {
        const school = await createSchoolService(req.body, req.user.id);
        return sendSuccess(res, 'School created successfully', school, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getAllSchools = async (req, res) => {
    try {
        const schools = await getAllSchoolsService();
        return sendSuccess(res, 'All schools fetched', schools);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getSchoolByUuid = async (req, res) => {
    try {
        const school = await getSchoolByUuidService(req.params.uuid);
        return sendSuccess(res, 'School fetched', school);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const updateSchoolStatus = async (req, res) => {
    try {
        const result = await updateSchoolStatusService(req.params.uuid, req.body.status);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const deleteSchool = async (req, res) => {
    try {
        const result = await deleteSchoolService(req.params.uuid);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const createAdmin = async (req, res) => {
    try {
        const admin = await createAdminService(req.body);
        return sendSuccess(res, 'Admin created successfully', admin, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const updateAdminStatus = async (req, res) => {
    try {
        const result = await updateAdminStatusService(req.params.uuid, req.body.status);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const createSchoolWithAdmin = async (req, res) => {
    try {
        const logoUrl = req.file ? req.file.path : null;
        const school = await createSchoolWithAdminService(req.body, req.user.id, logoUrl);
        return sendSuccess(res, 'School and Admin created successfully', school, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStatsService();
        return sendSuccess(res, 'Dashboard stats fetched', stats);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = {
    createSchool,
    getAllSchools,
    getSchoolByUuid,
    updateSchoolStatus,
    deleteSchool,
    createAdmin,
    updateAdminStatus,
    createSchoolWithAdmin,
    getDashboardStats,
};