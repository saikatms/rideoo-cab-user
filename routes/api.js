const express = require('express');
const router = express.Router();
const { apiAuth } = require('../config/authentication');
const indexCon = require('../controller/apiController/indexCon');
const categoryCon = require('../controller/apiController/categoryCon');

////////////// Firebase idToken verify /////////
router.post('/fbToken-verify', indexCon.idTokenVerify);
router.post('/rider-signup', indexCon.riderRegistration);
router.post('/check-phone-exists', indexCon.checkphoneExists);
router.patch('/phone-update', indexCon.riderPhoneNoUpdate);
router.post('/login', indexCon.riderLogin);
router.post('/login-with-phone', indexCon.loginWithPhone);
router.patch('/edit-profile', apiAuth, indexCon.editProfile);

router.post('/category-wise-fare', categoryCon.categoryList);

router.get('*', async (req, res) => {
    res.status(404).json({ status: 'error', message: 'Sorry! API your are looking for has not been found'});
});
router.post('*', async (req, res) => {
    res.status(404).json({ status: 'error', message: 'Sorry! API your are looking for has not been found'});
});

module.exports = router;