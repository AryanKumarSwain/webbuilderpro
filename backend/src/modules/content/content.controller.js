const {
    getModuleContentService,
    saveModuleContentService,
    togglePublishService,
    getPublicModuleContentService,
    getPublishedModuleKeysService,
} = require('./content.service');
const { sendSuccess, sendError, handleControllerError } = require('../../utils/response.utils');
const { recordMediaUsage } = require('../../utils/storage.utils');

const getModuleContent = async (req, res) => {
    try {
        const content = await getModuleContentService(req.user.schoolId, req.params.moduleKey);
        return sendSuccess(res, 'Content fetched', content);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const saveModuleContent = async (req, res) => {
    try {
        const { content, isPublished } = req.body;
        const result = await saveModuleContentService(
            req.user.schoolId,
            req.params.moduleKey,
            content,
            isPublished ?? 0
        );
        return sendSuccess(res, 'Content saved', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const togglePublish = async (req, res) => {
    try {
        const result = await togglePublishService(
            req.user.schoolId,
            req.params.moduleKey,
            req.body.isPublished
        );
        return sendSuccess(res, 'Publish status updated', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getPublicModuleContent = async (req, res) => {
    try {
        const content = await getPublicModuleContentService(
            req.params.schoolId,
            req.params.moduleKey
        );
        return sendSuccess(res, 'Public content fetched', content);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getPublishedModules = async (req, res) => {
    try {
        const moduleKeys = await getPublishedModuleKeysService(req.params.schoolId);
        return sendSuccess(res, 'Published modules fetched', moduleKeys);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const uploadContentImageHandler = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No image uploaded', 400);
        }
        await recordMediaUsage({
            schoolId: req.user.schoolId,
            moduleKey: req.query.moduleKey,
            resourceType: 'image',
            sizeBytes: req.file.size,
            url: req.file.path,
            publicId: req.file.filename,
        });
        return sendSuccess(res, 'Image uploaded', { url: req.file.path });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const uploadPdfHandler = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No PDF uploaded', 400);
        }
        await recordMediaUsage({
            schoolId: req.user.schoolId,
            moduleKey: req.query.moduleKey,
            resourceType: 'pdf',
            sizeBytes: req.file.size,
            url: req.file.path,
            publicId: req.file.filename,
        });
        return sendSuccess(res, 'PDF uploaded', { url: req.file.path });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const uploadVideoHandler = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No video uploaded', 400);
        }
        await recordMediaUsage({
            schoolId: req.user.schoolId,
            moduleKey: req.query.moduleKey,
            resourceType: 'video',
            sizeBytes: req.file.size,
            url: req.file.path,
            publicId: req.file.filename,
        });
        return sendSuccess(res, 'Video uploaded', { url: req.file.path });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = {
    getModuleContent,
    saveModuleContent,
    togglePublish,
    getPublicModuleContent,
    getPublishedModules,
    uploadContentImageHandler,
    uploadPdfHandler,
    uploadVideoHandler,
};