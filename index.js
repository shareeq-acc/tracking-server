const express = require("express")
const cors = require("cors")
const bp = require("body-parser");
require('dotenv').config()

const port = process.env.PORT || 8000
const app = express();
app.use(cors())
app.use(bp.json());
// app.use(bp.urlencoded({ extended: true }));

const decrypt = (salt, encoded) => {
    const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
    return encoded
        .match(/.{1,2}/g)
        .map((hex) => parseInt(hex, 16))
        .map(applySaltToChar)
        .map((charCode) => String.fromCharCode(charCode))
        .join("");
};

app.get("/", (req, res) => {
    res.json({
        message: "Success"
    })
})
app.post("/xyz/serve/track/:num", async (req, res) => {
    try {
        const num = req.params.num
        const key = req.body.key
        if (!key || !num) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }
        const token = decrypt("salty", key)
        const url = `https://api.postex.pk/services/integration/api/order/v1/track-order/${num}`
        const response = await fetch(url, {
            method: "GET",

            headers: {
                "Content-Type": "application/json",
                "token": token
            },
        });
        const data = await response.json();
        if(data.statusCode === "404") {
            return res.status(404).json({
                message:"Record Not Found"
            })
        }
        res.status(200).json({
            customerName:data.dist.customerName,
            trackingNumber:data.dist.trackingNumber,
            merchantName:data.dist.merchantName,
            transactionStatus:data.dist.transactionStatus,
            cityName:data.dist.cityName,
            transactionStatusHistory:data.dist.transactionStatusHistory
        })


    } catch (error) {
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
})
app.listen(port, () => {
    console.log("Server is running")
})