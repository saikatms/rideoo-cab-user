const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const tokens = require('../../config/tokens');
const Rider = require('../../model/riders');
const { admin } = require('../../config/fbConfig');
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});
module.exports = {

    idTokenVerify: async (req, res) => {
        try {
            const { idToken } = req.body;
            if((idToken) && (idToken !== "") && (idToken !== undefined)){
                admin.auth().verifyIdToken(idToken).then((decodedToken) => {
                    const uid = decodedToken.uid;
                    // console.log(decodedToken);
                    return res.status(200).json({ status:'success', data: decodedToken });
                }).catch((error) => {
                    return res.status(203).json({ status:'error', error: error.message });
                });
            }else{
                return res.status(203).json({ status:'error', error: "Sorry! Something went wrong." });
            }
        } catch (error) {
            console.log(error);
            res.status(203).json({ status:'error', error: error.message });
        }
    },

    getNewTokens: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (refreshToken){
                let payload = null;
                payload = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                // console.log(payload);
                if(payload !== null){
                    const whereCon = { id: payload.userId, is_deleted: '0' };
                    const checkResult = await dbFunction.fetchData(USER_MASTER, "", "", "", whereCon);
                    if(checkResult.length > 0){
                        if(checkResult[0].refresh_token === refreshToken){
                            const accessToken = tokens.createAccessToken(checkResult[0].id);
                            const newRefreshToken = tokens.createRefreshToken(checkResult[0].id);
                            const editData = {
                                refresh_token: newRefreshToken
                            }
                            const updatewhereCon = { id: payload.userId };
                            await dbFunction.update(USER_MASTER,editData,updatewhereCon);
                            return res.status(200).json({ status: 'success', accessToken: `Bearer ${accessToken}`, refreshToken: newRefreshToken });
                        }else{
                            return res.status(203).json({ status: 'error', message: "Invalid refresh token" });
                        }
                    }else{
                        return res.status(203).json({ status: 'error', message: "Invalid refresh token" });
                    }
                }else{
                    return res.status(203).json({ status: 'error', message: "Invalid refresh token" });
                }
            }else{
                return res.status(203).json({ status: 'error', message: "Invalid refresh token" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    riderRegistration : async (req, res) => {
        try {
            const { name,email,phone,password,referalCode } = req.body;
            if((name) && (name !== "") && (email) && (email !== "") && (password) && (password !== "") && (phone) && (phone !== "")){
                const checkUser = await Rider.find({ $or: [{ email: email }, { phone: phone }] });
                // console.log(checkUser.length);
                if(checkUser.length === 0){
                    const riderUser = new Rider({
                        name: name,
                        email: email,
                        phone: phone,
                        password: await bcrypt.hash(password, 10),
                        referalCode: referalCode
                    });
                    const result = await riderUser.save();
                    const accesstoken = tokens.createAccessToken(result._id);
                    const refreshToken = tokens.createRefreshToken(result._id);
                    await Rider.findByIdAndUpdate(result._id,{
                        refreshToken: refreshToken,
                        updatedAt: Date.now()
                    }, {new: true});

                    if(result.profileImg){
                        result.profileImg = await getSignedUrl(result.profileImg);
                    }
                    res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                }else{
                    return res.status(400).json({ status: 'error', error: 'Username OR Email ID already exists' });
                }
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },

    checkphoneExists: async (req, res) => {
        try {
            const { userId } = req.body;
            if(userId && userId !== ""){
                const checkUser = await Rider.findById(userId);
                if(checkUser){
                    if(!checkUser.phone){
                        return res.status(200).json({ status: 'error', error: "Phone number not found" });
                    }else{
                        if((checkUser.phone === null) || (checkUser.phone === "")){
                            return res.status(200).json({ status: 'error', error: "Phone number not found" });
                        }else{
                            return res.status(200).json({status: 'success'});
                        }
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: 'Sorry! User not Found.' });
                }
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },

    riderPhoneNoUpdate: async(req, res) => {
        try {
            const {phone, userId} = req.body;
            if(userId && (userId !== "") && (phone) && (phone !== "")){
                const checkUserPhone = await Rider.findOne({ 
                    $and: [
                        { _id: { $ne: userId } },
                        { $or: [{ phone: phone }] }
                    ]
                });
                if(checkUserPhone){
                    return res.status(203).json({ status: 'error', error: "Sorry! phone no already registered." });
                }else{
                    const updateData = { phone: phone, updatedAt: Date.now() };
                    const updateResult = await Rider.findByIdAndUpdate(userId,updateData, {new: true});
                    if(updateResult){
                        if(updateResult.profileImg){
                            updateResult.profileImg = await getSignedUrl(updateResult.profileImg);
                        }
                        return res.status(200).json({ status: 'success', data: updateResult });
                    }else{
                        res.status(203).json({ status:'error', error: "Sorry! Something went wrong." });
                    }
                }
            }else{
                res.status(203).json({ status:'error', error: "Sorry! Parameter missing or value missing." });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },

    loginWithPhone: async (req, res) => {
        try {
            const { phone } = req.body;
            if(phone && (phone !== "")){
                const result = await Rider.findOne({ $or: [{ phone: phone }] });
                if(result){
                    if(result.status === 'Y'){
                        const accesstoken = tokens.createAccessToken(result._id);
                        const refreshToken = tokens.createRefreshToken(result._id);
                        await Rider.findByIdAndUpdate(result._id,{
                            refreshToken: refreshToken,
                            updatedAt: Date.now()
                        }, {new: true});
                        if(result.profileImg){
                            result.profileImg = await getSignedUrl(result.profileImg);
                        }
                        return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                    }else{
                        return res.status(400).json({ status: 'error', error: "Sorry! account is Temporarily blocked by administrator." });
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: "Sorry! No accounts found." });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', error: error.message });
        }
    },
    
    riderLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            // console.log(req.body);
            if(username && (username !== "") && password && (password !== "")){
                const result = await Rider.findOne({ $or: [{ phone: username }, { email: username }] });

                if(result){
                    if(result.status === 'Y'){
                        const matchResult = await bcrypt.compare(password, result.password);
                        if(matchResult === true){
                            const accesstoken = tokens.createAccessToken(result._id);
                            const refreshToken = tokens.createRefreshToken(result._id);
                            await Rider.findByIdAndUpdate(result._id,{
                                refreshToken: refreshToken,
                                updatedAt: Date.now()
                            }, {new: true});
                            if(result.profileImg){
                                result.profileImg = await getSignedUrl(result.profileImg);
                            }
                            return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                        }else{
                            return res.status(400).json({ status: 'error', error: "Incorrect Username Or Password." });
                        }
                    }else{
                        return res.status(400).json({ status: 'error', error: "Sorry! account is Temporarily blocked by administrator." });
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: "Sorry! No accounts found." });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', error: error.message });
        }
    },

    editProfile: async (req, res) => {
        try {
            

            const { name, email, password, userId } = req.body;
            if(userId && (userId !== "") && (userId !== null) && (userId !== undefined)){
                const updateData = { updatedAt: Date.now() };
                
                if(email && (email !== "") && (email !== undefined) && (email !== "")){
                    const checkUserEmail = await Rider.findOne( 
                        {$and: [
                            { _id: { $ne: userId } },
                            { $or: [{ email: email }] }
                        ]}
                    );
                    if(checkUserEmail){
                        return res.status(400).json({ status: 'error', error: "Sorry! Email Id already registered." });
                    }else{
                        updateData['email'] = email;
                        console.log(updateData);
                    }
                }
                if(req.files && req.files.profilePic){
                    const allowType = ['image/png', 'image/jpeg', 'image/jpg'];
                    const uploadedFile = req.files.profilePic;
                    updateData['profileImg'] = await fileUpload(uploadedFile,"profile-pic-"+userId,allowType);
                }
                if(name && (name !== "") && (name !== undefined)){
                    updateData['name'] = name;
                } 
                // console.log(updateData);
                if(password && (password !== "") && (password !== undefined)) updateData['password'] = await bcrypt.hash(password, 10);
                const accesstoken = tokens.createAccessToken(userId);
                const refreshToken = tokens.createRefreshToken(userId);
                
                const updateResult = await Rider.findByIdAndUpdate(userId,updateData, {new: true});

                if(updateResult){
                    if(updateResult.profileImg){
                        updateResult.profileImg = await getSignedUrl(updateResult.profileImg);
                    }
                    return res.status(200).json({ status: 'success', data: updateResult,accessToken: accesstoken, refreshToken: refreshToken  });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    }
}

async function getSignedUrl(keyName){
    try {
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        });
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: keyName
        };
        
        const headCode = await s3.headObject(params).promise();
        if(headCode){
            const signedUrl = s3.getSignedUrl('getObject', params);
            return signedUrl;
        }else{
            throw new Error('Sorry! File not found')
        }
    } catch (error) {
        if (error.code === 'NotFound' || error.code === 'Forbidden') {
            throw new Error('Sorry! File not found')
        }
    }
    
}

async function fileUpload(requestFile,fileName,allowType){
    try {
        return new Promise(function(resolve, reject) {
            const uploadedFile = requestFile;
            if(allowType.includes(uploadedFile.mimetype)) {
                let uploadedFileName = uploadedFile.name;
                const filenameSplit = uploadedFileName.split('.');
                const fileExtension = filenameSplit[filenameSplit.length-1];
                uploadedFileName = fileName.toLowerCase().replace(" ", "-") +'-'+ Date.now()+ '.' + fileExtension;
                fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
                    const params = {
                        Bucket: process.env.BUCKET_NAME,
                        Key: "images/"+ uploadedFileName, // File name you want to save as in S3
                        Body: uploadedData 
                    };
                    s3.upload(params, async (err, data) => {
                        if (err) {
                            return reject("Sorry! File upload failed. " + err.message);
                        }else{
                            resolve(data.Key);
                        }
                    });
                });
            }else{
                return reject("Sorry! Invalid File.");
            }
        });
    } catch (error) {
        return reject(error.message);
    }
}