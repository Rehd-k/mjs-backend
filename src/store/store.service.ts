import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './entities/store.entity';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class StoreService {
  constructor(@InjectModel(Store.name) private storeModel: Model<Store>) { }
  async create(createStoreDto: CreateStoreDto, req: any) {
    try {
      const newStoreData = new this.storeModel(createStoreDto)
      newStoreData.initiator = req.user.username
      newStoreData.location = req.user.location
      const store = await newStoreData.save();

      return store;
    } catch (error) {
      errorLog(`Error creating one store: ${error}`, "ERROR")
      throw new BadRequestException(`Error creating one store: ${error.message}`);
    }

  }

  async findAll(req: any, query: any) {
    try {
      const store = await this.storeModel.find({ ...query, location: req.user.location }).exec()
      return store;
    } catch (error) {
      errorLog(`Error getting all store: ${error}`, "ERROR")
      throw new BadRequestException(`Error getting all store: ${error.message}`);
    }

  }

  async findOne(id: string) {
    try {
      const store = await this.storeModel.findById(id).populate({
        path: 'products.product', // 👈 nested path populate
        model: 'Product',
        select: 'title price quantity type cartonAmount'
      }).exec();
      return store;
    } catch (error) {
      errorLog(`Error getting one store: ${error}`, "ERROR")
      throw new NotFoundException(`Error getting one store: ${error.message}`);
    }

  }

  async sendOrReceiveStock(
    senderId: string,
    receiverId: string,
    body: { product: string; title: string; price: number; toSend: number }[]
  ): Promise<boolean> {
    try {
      if (!senderId || !receiverId || !Array.isArray(body) || body.length === 0) {
        throw new BadRequestException('Invalid request payload');
      }

      const [sender, receiver] = await Promise.all([
        this.storeModel.findById(senderId),
        this.storeModel.findById(receiverId),
      ]);


      if (!sender) throw new NotFoundException('Sender store not found');
      if (!receiver) throw new NotFoundException('Receiver store not found');

      // Convert products to Map for faster access
      const senderProducts = new Map(
        sender.products.map((p) => [p.product.toString(), p])
      );
      const receiverProducts = new Map(
        receiver.products.map((p) => [p.product.toString(), p])
      );

      for (const item of body) {
        const { product, title, price, toSend } = item;

        if (!toSend || toSend <= 0) {
          throw new BadRequestException(`Invalid quantity for ${title}`);
        }

        // Update sender stock
        const sendingProduct = senderProducts.get(product);
        if (!sendingProduct) {
          throw new NotFoundException(
            `Product "${title}" not found in sender's store`
          );
        }
        if (sendingProduct.quantity < toSend) {
          throw new BadRequestException(
            `Insufficient stock of "${title}" at sender's store`
          );
        }
        sendingProduct.quantity -= toSend;

        // Update or add receiver stock
        const receivingProduct = receiverProducts.get(product);
        if (receivingProduct) {
          receivingProduct.quantity += toSend;
        } else {
          receiver.products.push({
            product: new mongoose.Types.ObjectId(product),
            title,
            price,
            quantity: toSend,
          });
        }
      }

      await Promise.all([sender.save(), receiver.save()]);
      return true;
    } catch (error) {
      errorLog(`Error sending/receiving stock: ${error.message}`, 'ERROR');
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to process stock transfer');
    }
  }


  async update(id: string, updateStoreDto: any, filter: any) {
    try {
      const store = await this.storeModel.findById(id)
      if (!store)
        throw new BadRequestException('Store Not Found')
      Object.entries(updateStoreDto).forEach(async ([key, value]) => {
        store[key] = value
      })
      return store.save();
    } catch (error) {
      errorLog(`Error updating one store: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async remove(id: string) {
    try {
      return await this.storeModel.findByIdAndDelete(id);
    } catch (error) {
      errorLog(`Error removing one store: ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }
}
