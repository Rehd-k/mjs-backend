import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Invoice } from './invoice.schema';
import { Model } from 'mongoose';
import { ActivityService } from 'src/activity/activity.service';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';



@Injectable()
export class InvoiceService {
  // , private whatsappService: WhatsappService
  constructor(@InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>, private logService: ActivityService) { }
  async create(createInvoiceDto: CreateInvoiceDto, req: any) {
    try {
      createInvoiceDto['initiator'] = req.user.username
      createInvoiceDto['location'] = req.user.location;
      const invoice = await this.invoiceModel.create(createInvoiceDto)
      this.logService.logAction(req.user.userId, req.user.username, 'Create Invoice', `Created Invoice for user with id ${invoice.customer}`)
      return invoice;
    } catch (error) {
      errorLog(`error creating  invoice ${error}`, "ERROR")
      throw new BadRequestException(error);
    }

  }

  async findAll(query: QueryDto, req: any): Promise<Invoice[]> {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
      limit = 10,
      startDate,
      endDate,
      selectedDateField
    } = query;

    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);
    try {
      if (startDate && endDate && selectedDateField) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Start of day

        const end = new Date(endDate);
        end.setHours(24, 59, 59, 999); // End of day

        parsedFilter[selectedDateField] = { $gte: start, $lte: end };
      }


      // Handle customer search
      if (parsedFilter.customer) {
        const customerQuery = parsedFilter.customer;
        delete parsedFilter.customer;

        parsedFilter['$or'] = [
          { 'customer.name': { $regex: customerQuery['$regex'], $options: 'i' } },
          { 'customer.phone_number': { $regex: customerQuery['$regex'], $options: 'i' } }
        ];
      }



      const result = await this.invoiceModel.find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .limit(Number(limit))
        .select(select)
        .populate('bank customer')
        .exec();
      return result;
    } catch (error) {
      errorLog(`Error fetching invoices: ${error.message}`, "ERROR")
      throw new Error(`Error fetching invoices: ${error.message}`);
    }
  }

  async findAllCustomersInvoices(query: QueryDto, req: any): Promise<{ result: Invoice[], totalDocuments: number }> {
    const {
      filter = '{}',
      sort = '{}',
      skip = 0,
      select = '',
      limit = 10,
      startDate,
      endDate,
      selectedDateField
    } = query;

    const parsedFilter = JSON.parse(filter);
    const parsedSort = JSON.parse(sort);

    try {
      if (startDate && endDate && selectedDateField) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Start of day

        const end = new Date(endDate);
        end.setHours(24, 59, 59, 999); // End of day

        parsedFilter[selectedDateField] = { $gte: start, $lte: end };
      }

      const result = await this.invoiceModel.find({ ...parsedFilter, location: req.user.location })
        .sort(parsedSort)
        .skip(Number(skip))
        .limit(Number(limit))
        .populate('bank customer')
        .select(select)
        .exec();

      const totalDocuments = await this.invoiceModel
        .countDocuments({ ...parsedFilter, location: req.user.location })
        .exec();


      return { result, totalDocuments };

    } catch (error) {
      errorLog(`Error fetching invoices: ${error.message}`, "ERROR")
      throw new Error(`Error fetching invoices: ${error.message}`);
    }
  }

  async getCustomerDashBoardInfo(query: QueryDto, req: any) {

    const {
      filter = '{}'
    } = query;

    const parsedFilter = JSON.parse(filter);
    // Define base filter
    const baseMatch = {
      customer: parsedFilter.customer,
      location: req.user.location
    };

    // Get today and tomorrow for dueToday filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Define aggregation filters
    const aggregationFilters = {
      all: { ...baseMatch },
      paid: { ...baseMatch, status: 'paid' },
      pending: { ...baseMatch, status: 'pending' },
      dueToday: { ...baseMatch, dueDate: { $gte: today, $lt: tomorrow } }
    };

    // Helper to run aggregation
    const runAggregation = async (match) => {
      const result = await this.invoiceModel.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      return result[0]?.total || 0;
    };

    // Run all aggregations in parallel
    const [
      totalAmountAllValue,
      totalAmountPaidValue,
      totalAmountPendingValue,
      totalAmountDueTodayValue
    ] = await Promise.all([
      runAggregation(aggregationFilters.all),
      runAggregation(aggregationFilters.paid),
      runAggregation(aggregationFilters.pending),
      runAggregation(aggregationFilters.dueToday)
    ]);

    return {

      totalAmountAllValue,
      totalAmountPaidValue,
      totalAmountPendingValue,
      totalAmountDueTodayValue
    };

  }

  findOne(filter: string) {
    try {
      return this.invoiceModel.findOne(JSON.parse(filter));
    } catch (error) {
      errorLog(`Error fetching one invoice: ${error.message}`, "ERROR")
      throw new Error(`Error fetching invoices: ${error.message}`);
    }

  }

  async update(filter: string, updateInvoiceDto: UpdateInvoiceDto, req: any) {


    const invoice = await this.invoiceModel.findOne(JSON.parse(filter))


    if (!invoice) {
      throw new Error(`Invoice not found`);
    }

    // Iterate through the product list in updateInvoiceDto and the items list in invoice
    if (updateInvoiceDto['products'] && Array.isArray(updateInvoiceDto['products']) && Array.isArray(invoice.items)) {
      updateInvoiceDto['products'].forEach(productDto => {
        const matchingItem = invoice.items.find(item => item.title === productDto.title);
        if (matchingItem) {
          // Add the invoice item's quantity value to quantity_paid
          if (typeof matchingItem.quantity_paid !== 'number') {
            matchingItem.quantity_paid = 0;
          }
          matchingItem.quantity_paid += Number(productDto.quantity) || 0;
        }
      });
    }

    if (updateInvoiceDto['transactionId']) {
      invoice['transactionId'].push(updateInvoiceDto['transactionId'])
    }

    // Sum up quantity_paid and quantity for all items
    let totalQuantityPaid = 0;
    let totalQuantity = 0;
    if (Array.isArray(invoice.items)) {
      invoice.items.forEach(item => {
        totalQuantityPaid += Number(item.quantity_paid) || 0;
        totalQuantity += Number(item.quantity) || 0;
      });
    }

    if (totalQuantity > 0) {
      if (totalQuantityPaid >= totalQuantity) {
        invoice.status = 'paid';
      } else if (totalQuantityPaid < totalQuantity && totalQuantityPaid > 0) {
        invoice.status = 'Part Pay';
      }
    }
    try {
      await this.logService.logAction(req.user.userId, req.user.username, 'Update Invoice', `Updated Invoice with id ${filter}`)
      return invoice.save();
    } catch (error) {
      errorLog(`Error updating one invoice: ${error}`, "ERROR")
      throw new Error(`Error updating invoices: ${error.message}`);
    }

  }

  async sendMessage(id: string) {
    const invoice = await this.invoiceModel.findById(id).populate('customer') as any;


    invoice.customer.phone_number = this.formatPhoneNumber(invoice.customer.phone_number)


    // const media = new MessageMedia(
    //   'application/pdf',
    //   pdf.toString('base64'),
    //   `invoice_for_${invoice.customer.name}.pdf`,
    // );

    // const messade = await this.whatsappService.sendMessage(invoice.customer.phone_number, media);
    // return messade;
  }

  async remove(filter: any, req: any) {
    try {
      await this.invoiceModel.findOneAndDelete(filter)
      await this.logService.logAction(req.user.userId, req.user.username, 'Remove Invoice', `Removed Invoice with filter ${JSON.stringify(filter)}`)
      return true;
    } catch (error) {
      errorLog(`Error removing one invoice: ${error}`, "ERROR")
      throw new Error(`Error removing invoices: ${error.message}`);
    }

  }

  formatPhoneNumber(phone: string): string {
    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('0')) {
      return `234${digits.substring(1)}@c.us`;
    } else if (digits.startsWith('234')) {
      return `${digits}@c.us`;
    } else {
      throw new Error('Invalid Nigerian phone number');
    }
  }
}
