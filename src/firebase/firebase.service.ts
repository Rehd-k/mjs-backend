import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UserService } from 'src/user/user.service';

@Injectable()
export class FirebaseService {

    constructor(private userservice: UserService) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: 'avira-suite',  // From Firebase console > Project settings
                    clientEmail: process.env.clientEmail,  // We'll create this
                    privateKey: process.env.private_key,  // We'll create this
                }),
            });
        }
    }

    async sendNotification(token: string, title: string, body: string) {
        const message = {
            notification: { title, body },
            token,
        };
        console.log(message)
        try {
            await admin.messaging().send(message);
            console.log('Notification sent');
        } catch (error) {
            console.error('Error sending: ', error);
        }
    }

    async sendToUser(userId: string, title: string, body: string) {
        // Fetch token from DB (we'll add DB in Step 4)
        const token = await this.getUserToken(userId);  // Placeholder
        if (token) await this.sendNotification(token, title, body);
    }

    async getUserToken(userId: string): Promise<string> {
        let token = await this.userservice.getOneById(userId);
        if (token) {
            return token?.fcmToken;
        } else {
            return '';
        }
    }
}