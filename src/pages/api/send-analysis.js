import multiparty from "multiparty";
import fs from "fs";
import path from "path";
import Twilio from "twilio";

export const config = {
    api: {
        bodyParser: false, // Needed for multiparty
    },
};

const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const twilioClientWhatsapp = Twilio(
    process.env.TWILIO_ACCOUNT_SID_WHATSAPP,
    process.env.TWILIO_AUTH_TOKEN_WHATSAPP
)
    
function seasonUrl(season) {
    switch (season) {
        case "Spring":
            return 'https://shop-talk-26-assets-images-2288.twil.io/spring-1.jpeg';
        case "Autumn":
            return 'https://shop-talk-26-assets-images-2288.twil.io/autumn-1.jpeg';
        case "Winter":
            return 'https://shop-talk-26-assets-images-2288.twil.io/winter-1.jpeg';
        case "Summer":
            return 'https://shop-talk-26-assets-images-2288.twil.io/summer-1.jpeg';
        case "Light":
            return 'https://shop-talk-26-assets-images-2288.twil.io/light-1.jpeg';
        case "Deep":
            return 'https://shop-talk-26-assets-images-2288.twil.io/deep-1.jpeg';
        case "Cool":
            return 'https://shop-talk-26-assets-images-2288.twil.io/cool-1.jpeg';
        case "Muted":
            return 'https://shop-talk-26-assets-images-2288.twil.io/muted-1.jpeg';
        case "Warm":
            return 'https://shop-talk-26-assets-images-2288.twil.io/warm-1.jpeg';
        case "Bright":
            return 'https://shop-talk-26-assets-images-2288.twil.io/bright-1.jpeg';
        default:
            return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const form = new multiparty.Form();

    form.parse(req, async (err, fields) => {
        if (err) {
            console.error("Form parse error:", err);
            return res.status(500).json({ error: "Form parse error" });
        }
        console.log("Received form fields:", fields);
        
        try {
            
           
            const buttonSelection = fields.buttonSelection?.[0] || "";
            const inputText = fields.inputText?.[0] || "";
            let arr = JSON.parse(buttonSelection);

            // New: Get dropdown values
            const firstName = fields.first_name?.[0] || "";
            const phone = fields.phone?.[0] || "";
            // Get delivery method from form
            const service = fields.service?.[0] || fields.deliveryMethod?.[0]; // Default to SMS if not provided

            console.log("Dropdown values:", { firstName, phone, service });
            console.log("Button Selection:", buttonSelection);
            console.log("Input Text:", inputText);
            

            
            let mediaUrlToSend = []
            arr.forEach(season => {
                mediaUrlToSend.push(seasonUrl(season));
            });

            console.log("arr:", arr);  
            console.log("type of arr:", Array.isArray(arr));
            console.log("mediaUrlToSend:", mediaUrlToSend);
            console.log("type mediaUrlToSend:", Array.isArray(mediaUrlToSend));



            // Use service variable for delivery method
            const deliveryMethod = service;
            // Use phone and firstName for recipient info
            let recipientName = firstName;
            let recipientPhone = phone || process.env.MY_PHONE_NUMBER;

            // If no dropdown option selected, use manual entry
            if (!firstName && !phone && fields.manualName?.[0] && fields.manualPhone?.[0]) {
                recipientName = fields.manualName[0];
                recipientPhone = fields.manualPhone[0];
            }

            if (deliveryMethod.toLowerCase() === 'whatsapp') {
                console.log("Sending WhatsApp via Twilio to", recipientPhone);
                await twilioClientWhatsapp.messages.create({
                    from: process.env.TWILIO_NUMBER_WHATSAPP,
                    to: `whatsapp:${recipientPhone}`,
                    body: `Color Analysis for ${recipientName}`,
                    mediaUrl: mediaUrlToSend,
                });
            } else {
                console.log("Sending SMS via Twilio to", recipientPhone);
                await twilioClient.messages.create({
                    from: process.env.TWILIO_NUMBER,
                    to: recipientPhone,
                    body: `Color Analysis for ${recipientName}`,
                    mediaUrl: mediaUrlToSend,
                });
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error sending Twilio message:", error);
            return res.status(500).json({ error: error.message });
        }
    });
}