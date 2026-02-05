const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// 1. Notification trigger on new Test Result
exports.onTestCreated = functions.firestore
    .document('tests/{testId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const { ownerName, vehicleNumber, testResult, testDate, validityDate } = data;

        // In a real app, you'd fetch the user's email based on userId or vehicle owner
        // For demo, we'll log it or send to a fixed admin email
        console.log(`New Test for ${vehicleNumber}: ${testResult}`);

        // Notification Logic (Email)
        // const transporter = nodemailer.createTransport({ ... });
        // await transporter.sendMail({ ... });

        // Notification Logic (Push)
        // const token = ...;
        // await admin.messaging().send({ token, notification: { title: 'Test Result', body: `${vehicleNumber} ${testResult}` } });

        // Save notification to DB
        await db.collection('notifications').add({
            title: `Emission Test ${testResult}`,
            message: `Vehicle ${vehicleNumber} tested on ${testDate}. Result: ${testResult}. Valid until: ${validityDate}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            type: testResult === 'Pass' ? 'success' : 'alert'
        });
    });

// 2. Scheduled Job: Check for Expiring Certificates (Daily)
// Requires Blaze plan
exports.checkExpiry = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const snapshot = await db.collection('tests')
        .where('validityDate', '<=', nextWeek.toISOString().split('T')[0])
        .where('validityDate', '>=', today.toISOString().split('T')[0])
        .get();

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Expiring: ${data.vehicleNumber} on ${data.validityDate}`);
        // Send alert...
    });
});

// 3. Custom Claims for Roles
exports.setCustomClaims = functions.firestore
    .document('users/{uid}')
    .onWrite(async (change, context) => {
        const data = change.after.data();
        if (data && data.role) {
            const customClaims = { role: data.role };
            try {
                await admin.auth().setCustomUserClaims(context.params.uid, customClaims);
                console.log(`Set custom claims for ${context.params.uid}: ${data.role}`);
            } catch (error) {
                console.error(error);
            }
        }
    });
