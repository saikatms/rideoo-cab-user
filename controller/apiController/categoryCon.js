const AWS = require('aws-sdk');
const Rider = require('../../model/riders');
const CarCategory = require('../../model/carCategory');
const Fare = require('../../model/fare');
const fs = require('fs');
module.exports = {

    categoryList: async (req, res) => {
        try {
            const { fromLat, fromLng, toLat, toLng, distance, estimatedTime } = req.body;
            const fareList = await Fare.find().populate({
                path: 'carCategory',
                select: { '_id': 1,'name': 1, 'image': 1},
                match: { status: '1' }
            });
            let newArray = [];
            for(let i=0; i < fareList.length; i++){
                if(fareList[i].carCategory !== null){
                    const baseFare = fareList[i].base_fare;
                    const baseKm = fareList[i].base_km;
                    const ratePerKm = fareList[i].per_km_fare;
                    const perMinuteFare = fareList[i].per_min_fare;
                    const calculateFare = parseFloat(baseFare) + ((parseFloat(distance) - parseFloat(baseKm)) * parseFloat(ratePerKm)) + (parseFloat(estimatedTime) * parseFloat(perMinuteFare));
                    const newData = {
                        _id: fareList[i].carCategory._id,
                        _fareId: fareList[i]._id,
                        name: fareList[i].carCategory.name,
                        photo: await getSignedUrl(fareList[i].carCategory.image, "driver"),
                        rideFare: calculateFare
                    }
                    newArray.push(newData);
                }
            }
            res.status(200).json({ status:'success', data: newArray });
        } catch (error) {
            res.status(203).json({ status:'error', error: error.message });
        }
    }
}

async function getSignedUrl(keyName, type){
    try {
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        });
        const params = {
            Bucket: ((type === 'driver')? process.env.DRIVER_BUCKET_NAME : process.env.BUCKET_NAME),
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