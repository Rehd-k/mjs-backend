import { Controller, Get, Param, Query } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Controller('notification')
export class FirebaseController {
    constructor(private firebaseService: FirebaseService) { }


    @Get('test/:id/:title/:body')
    async sendTestNotification(
        @Param('id') id: any,
        @Param('title') title: any,
        @Param('body') body: any
    ) {
        await this.firebaseService.sendToUser(
            id, title, body
        )
    }
}
