import { Injectable, NotFoundException, Request } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBankDto } from './dto/create-bank.dto';
import { Bank } from './entities/bank.entity';
import { errorLog } from 'src/helpers/do_loggers';

@Injectable()
export class BankService {
    constructor(@InjectModel(Bank.name) private readonly bankModel: Model<Bank>) { }

    async create(createBankDto: CreateBankDto, req: any): Promise<Bank> {

        try {
            const createdBank = new this.bankModel(createBankDto);
            createdBank.initiator = req.user.username;
            createdBank.location = req.user.location;
            return await createdBank.save();
        } catch (error) {
            errorLog(`Error creating bank: ${error.message}`, "ERROR")
            throw new Error(`Error creating bank: ${error.message}`);
        }
    }

    async findAll(req): Promise<Bank[]> {
        try {
            const banks =  await this.bankModel.find({location : req.user.location}).exec();
            console.log(banks);
            return banks
        } catch (error) {
            errorLog(`Error finding banks: ${error.message}`, "ERROR")
            throw new Error(`Error finding banks: ${error.message}`);
        }
    }

    async findOne(id: string): Promise<Bank> {
        try {
            const bank = await this.bankModel.findById(id).exec();
            if (!bank) {
                throw new NotFoundException(`Bank with ID ${id} not found`);
            }
            return bank;
        } catch (error) {
            errorLog(`Error finding bank: ${error.message}`, "ERROR")
            throw new Error(`Error finding bank: ${error.message}`);
        }
    }

    async update(id: string, updateBankDto: any): Promise<Bank> {
        try {
            const updatedBank = await this.bankModel.findByIdAndUpdate(id, updateBankDto, { new: true }).exec();
            if (!updatedBank) {
                throw new NotFoundException(`Bank with ID ${id} not found`);
            }
            return updatedBank;
        } catch (error) {
            errorLog(`Error updating bank: ${error.message}`, "ERROR")
            throw new Error(`Error updating bank: ${error.message}`);
        }
    }

    async remove(id: string): Promise<Bank> {
        try {
            const deletedBank = await this.bankModel.findByIdAndDelete(id).exec();
            if (!deletedBank) {
                throw new NotFoundException(`Bank with ID ${id} not found`);
            }
            return deletedBank;
        } catch (error) {
            errorLog(`Error deleting bank: ${error.message}`, "ERROR")
            throw new Error(`Error deleting bank: ${error.message}`);
        }
    }
}