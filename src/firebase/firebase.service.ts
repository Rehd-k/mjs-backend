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


        try {
            await admin.messaging().send(message);

        } catch (error) {
            console.error('Error sending: ', error);
        }
    }

    async sendToUser(userId: string, title: string, body: string, token?: string) {

        if (token) {
            await this.sendNotification(token, title, body);
            return
        } else {
            const inToken = await this.getUserToken(userId);  // Placeholder
            if (inToken) await this.sendNotification(inToken, title, body);
        }

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