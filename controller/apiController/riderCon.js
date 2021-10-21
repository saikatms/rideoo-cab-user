const Rider = require('../../model/riders');
const bcrypt = require('bcryptjs');
const fs = require('fs');
module.exports = {

    documentsUpload: async (req, res) => {
        try {
            const { name, userId } = req.body;
            if((userId) && (userId !== "") && (name) && (name !== "")){
                if(req.files){
                    const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
                    const destination = 'public/images/uploads/document/';
                    if(req.files.document_file){
                        const uploadResult = await fileUpload(req.files.document_file,name + userId.substr(userId.length - 4),allowType,destination);
                        // console.log(uploadResult);
                        if((uploadResult) && (uploadResult !== "")){
                            await Driver.findByIdAndUpdate(userId,{$push:{documents:{name:name, filename:uploadResult}}}, {new: true});
                            return res.status(200).json({ status: 'success' });
                        }else{
                            return res.status(203).json({ status:'error', error: "Sorry! File upload failed." });
                        }
                    }
                } else {
                    return res.status(203).json({ status:'error', error: "Sorry! Please upload a file." });
                }
            }else{
                return res.status(203).json({ status:'error', error: "Sorry! Parameter misssing." });
            }
        } catch (error) {
            console.log(error);
            res.status(203).json({ status:'error', error: error.message });
        }
    },

    removeDocument: async (req, res) => {
        try {
            const { docId, userId, imageName } = req.body;
            if((docId) && (docId !== "") && (userId) && (userId !== "") && (imageName) && (imageName !== "")){
                const fileLocation = 'public/images/uploads/document/'+imageName;
                fs.unlink(fileLocation, async (err) => {
                    if (err) {
                        return res.status(203).json({ status:'error', error: err.message });
                    }
                    const removeData = await Driver.findByIdAndUpdate(userId,{$pull:{documents:{_id: docId}}}, {new: true});
                    if(removeData){
                        return res.status(200).json({ status: 'success' });
                    }else{
                        return res.status(203).json({ status:'error', error: "Sorry! Something went wrong." });
                    }
                });
            }else{
                return res.status(203).json({ status:'error', error: "Sorry! Parameter misssing." });
            }
        } catch (error) {
            console.log(error);
            res.status(203).json({ status:'error', error: error.message });
        }
    },

    updateDocument: async (req, res) => {
        try {
            const { docId, userId } = req.body;
            const drivers = await Driver.findOne({_id: userId}, {"documents": 1});
            // console.log(users.documents.length);
            for(let i=0; i<drivers.documents.length; i++){
                if(drivers.documents[i]._id == docId){
                    if((req.files) && (req.files.document_file)){
                        const allowType = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
                        const destination = 'public/images/uploads/document/';
                        const uploadResult = await fileUpload(req.files.document_file,drivers.documents[i].name + userId.substr(userId.length - 4),allowType,destination);
                        // console.log(uploadResult);
                        if((uploadResult) && (uploadResult !== "")){
                            const updateData = await Driver.updateOne({userId, "documents._id": docId},{$set:{'documents.$.filename':uploadResult}}, {new: true});
                            if(updateData){
                                const oldFileLocation = 'public/images/uploads/document/'+ drivers.documents[i].filename;
                                fs.unlink(oldFileLocation, async (err) => {
                                    if (err) {
                                        return res.status(203).json({ status:'error', error: err.message });
                                    }
                                    return res.status(200).json({ status: 'success' });
                                });
                            }else{
                                return res.status(203).json({ status:'error', error: "Sorry! File upload failed." });
                            }
                        }else{
                            return res.status(203).json({ status:'error', error: "Sorry! File upload failed." });
                        }
                    } else {
                        return res.status(203).json({ status:'error', error: "Sorry! Please upload a file." });
                    }
                }
            }
        } catch (error) {
            console.log(error);
            res.status(203).json({ status:'error', error: error.message });
        }
        
    }
}

async function fileUpload(requestFile,fileName,allowType,destination){
    try {
        const uploadedFile = requestFile;
        if(allowType.includes(uploadedFile.mimetype)) {
            let uploadedFileName = uploadedFile.name;
            const filenameSplit = uploadedFileName.split('.');
            const fileExtension = filenameSplit[filenameSplit.length-1];
            uploadedFileName = fileName.toLowerCase().replace(" ", "-") +'-'+ Date.now()+ '.' + fileExtension;
            await uploadedFile.mv(destination + uploadedFileName);
            return uploadedFileName;
        }else{
            throw new Error('Sorry! Invalid File.')
            // throw {status: 'error', message: 'Sorry! Invalid File.'};
        }
    } catch (error) {
        throw new Error(error)
    }
    
}