import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { QueryDto } from 'src/product/query.dto';
import { errorLog } from 'src/helpers/do_loggers';
import { CashflowService } from 'src/cashflow/cashflow.service';
import { OtherIncome } from './other-income.entity';

@Injectable()
export class OtherIncomeService {
    constructor(@InjectModel(OtherIncome.name) private readonly otherIncomeModel: Model<OtherIncome>, private cashFlowService: CashflowService) { }


    async createotherIncome(body: any, req: any) {
        try {
            body.date = new Date(body.date)
            body.initiator = req.user.username
            body.location = req.user.location;
            const newOtherIncome = await this.otherIncomeModel.create(body);
            return newOtherIncome
        } catch (error) {
            errorLog(`error creating other Income ${error}`, "ERROR")
            throw new BadRequestException(error);
        }


    }

    async updateotherIncome(id: string, updateData: Partial<OtherIncome>) {
        try {
            const otherIncome = await this.otherIncomeModel.findById(id);
            if (!otherIncome) {
                throw new BadRequestException(`other Income with id ${id} not found`);
            }
            for (const key in updateData) {
                if (updateData.hasOwnProperty(key)) {
                    otherIncome[key] = updateData[key];
                }
            }
            return await otherIncome.save();
        } catch (error) {
            errorLog(`error updating other Income ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async deleteotherIncome(id: string) {
        try {
            return await this.otherIncomeModel.findByIdAndDelete(id);
        } catch (error) {
            errorLog(`error deleting otherIncome ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getOtherIncome(query: QueryDto, req: any) {
        const {
            filter = '{}',
            sort = '{}',
            skip = 0,
            select = '',
            limit = 10,
            startDate,
            endDate
        } = query;
        const parsedFilter = JSON.parse(filter);
        const parsedSort = JSON.parse(sort);

        if (!startDate || !endDate) {
            throw new BadRequestException(`Start date and end date are required`);
        }

        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(24, 59, 59, 999);

            parsedFilter.createdAt = { $gte: start, $lte: end };
           
            if (parsedFilter.category == 'category' || parsedFilter.category == 'All') {
                delete parsedFilter.category
            }
            const dbOtherIncome = await this.otherIncomeModel.find({ ...parsedFilter, location: req.user.location })
                .sort(parsedSort)
                .skip(Number(skip))
                .limit(Number(limit))
                .select(select)
                .exec()
            const otherIncomeCount = await this.otherIncomeModel.countDocuments({ ...parsedFilter, location: req.user.location })
            const result = { otherIncome: dbOtherIncome, otherIncomeCount: otherIncomeCount }
            return result;
        } catch (error) {
            errorLog(`error reading all other Income ${error}`, "ERROR")
            throw new BadRequestException(error);
        }
    }

    async getTotalOtherIncome(query: QueryDto, req: any) {
        try {
            const {
                startDate,
                endDate
            } = query;

            if (!startDate || !endDate) {
                throw new BadRequestException(`Start date and end date are required`);
            }

            // 1. Establish the precise date ranges needed for the queries.
            // For the user-defined range, we use the very start of the startDate
            // and the absolute end of the endDate to be inclusive.
            const startOfDay = new Date(startDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);

            // For the monthly total, we calculate the start of the first day
            // and the end of the last day of the month derived from the startDate.
            const firstDayOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
            const lastDayOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 0);
            lastDayOfMonth.setHours(23, 59, 59, 999);


            const pipeline: PipelineStage[] = [
                // 2. Use the $facet stage to run multiple independent aggregation pipelines
                // on the same collection without needing to query the database multiple times.
                {
                    $facet: {
                        // Pipeline (A): Calculates stats for the specific date range provided.
                        dateRangeStats: [
                            {
                                $match: {
                                    date: { $gte: startOfDay, $lte: endOfDay },
                                    location: req.user.location

                                }
                            },
                            {
                                $group: {
                                    _id: null, // Group all matched documents into a single result
                                    totalAmount: { $sum: '$amount' },
                                    approvedAmount: {
                                        // Only add to the sum if the 'approved' field is true
                                        $sum: { $cond: ['$approved', '$amount', 0] }
                                    },
                                    unapprovedAmount: {
                                        // Only add to the sum if the 'approved' field is false
                                        $sum: { $cond: [{ $eq: ['$approved', false] }, '$amount', 0] }
                                    },
                                    documentCount: { $sum: 1 } // Count the documents
                                }
                            }
                        ],
                        // Pipeline (B): Finds the category with the highest spending in the date range.
                        highestSpendingCategory: [
                            {
                                $match: {
                                    date: { $gte: startOfDay, $lte: endOfDay },
                                    location: req.user.location
                                }
                            },
                            {
                                $group: {
                                    _id: '$category', // Group documents by category
                                    totalSpent: { $sum: '$amount' }
                                }
                            },
                            { $sort: { totalSpent: -1 } }, // Sort by the most spent
                            { $limit: 1 } // Take only the top one
                        ],
                        // Pipeline (C): Calculates the total otherIncome for the entire current month.
                        monthlyTotal: [
                            {
                                $match: {
                                    date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
                                    location: req.user.location
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: '$amount' }
                                }
                            }
                        ],
                        // Pipeline (D): Gets the 10 most recent transactions in the date range.
                        latestTransactions: [
                            {
                                $match: {
                                    location: req.user.location
                                    // date: { $gte: startOfDay, $lte: endOfDay }
                                }
                            },
                            { $sort: { date: -1 } }, // Sort by date, newest first
                            { $limit: 10 } // Get the top 10
                        ]
                    }
                },
                // 3. Project the results into a clean, flat structure.
                // The $facet stage returns an object with arrays. We use $arrayElemAt
                // to safely extract the single result object from each array.
                // $ifNull is used to provide a default value if a facet pipeline returns no documents.
                {
                    $project: {
                        _id: 0, // Exclude the default _id field
                        totalInRange: { $ifNull: [{ $arrayElemAt: ['$dateRangeStats.totalAmount', 0] }, 0] },
                        approvedInRange: { $ifNull: [{ $arrayElemAt: ['$dateRangeStats.approvedAmount', 0] }, 0] },
                        unapprovedInRange: { $ifNull: [{ $arrayElemAt: ['$dateRangeStats.unapprovedAmount', 0] }, 0] },
                        documentCountInRange: { $ifNull: [{ $arrayElemAt: ['$dateRangeStats.documentCount', 0] }, 0] },
                        highestSpendingCategory: { $ifNull: [{ $arrayElemAt: ['$highestSpendingCategory', 0] }, { _id: 'N/A', totalSpent: 0 }] },
                        totalForMonth: { $ifNull: [{ $arrayElemAt: ['$monthlyTotal.total', 0] }, 0] },
                        latestTransactions: { $ifNull: ['$latestTransactions', []] }
                    }
                }
            ];

            return this.otherIncomeModel.aggregate(pipeline);
        } catch (error) {
            errorLog(`error getting  total otherIncome ${error}`, "ERROR")
            throw new BadRequestException(error);
        }

    }

    async getotherIncomeData(option: string, req: any): Promise<any> {
        let now = new Date(new Date().getTime() + 60 * 60 * 1000);
        let startDate, endDate, groupBy;

        switch (option) {
            case "Today":
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(24, 59, 59, 999));
                groupBy = {
                    for: {
                        $add: [
                            {
                                $divide: [
                                    { $subtract: [{ $hour: "$date" }, { $mod: [{ $hour: "$date" }, 2] }] },
                                    2
                                ]
                            },
                            1
                        ]
                    }
                };
                break;
            case "This Week":
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                groupBy = { for: { $dayOfWeek: "$date" } };
                break;
            case "Last 7 Days":
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);

                endDate = new Date();
                endDate.setHours(24, 59, 59, 999);

                groupBy = {
                    for: {
                        $subtract: [
                            {
                                $add: [
                                    {
                                        $dateDiff: {
                                            startDate: startDate,
                                            endDate: "$date",
                                            unit: "day"
                                        }
                                    },
                                    1
                                ]
                            },
                            1
                        ]
                    }
                };
                break;
            case "Last Week":
                startDate = new Date(now.setDate(now.getDate() - now.getDay() - 7));
                endDate = new Date(now.setDate(now.getDate() - now.getDay() - 1));
                groupBy = { for: { $dayOfWeek: "$date" } };
                break;
            case "This Month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                groupBy = { for: { $dayOfMonth: "$date" } };
                break;
            case "Last Month":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                groupBy = { for: { $dayOfMonth: "$date" } };
                break;
            case "First Quarter":
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 3, 0);
                groupBy = { for: { $month: "$date" } };
                break;
            case "Second Quarter":
                startDate = new Date(now.getFullYear(), 3, 1);
                endDate = new Date(now.getFullYear(), 6, 0);
                groupBy = { for: { $month: "$date" } };
                break;
            case "Third Quarter":
                startDate = new Date(now.getFullYear(), 6, 1);
                endDate = new Date(now.getFullYear(), 9, 0);
                groupBy = { for: { $month: "$date" } };
                break;
            case "Fourth Quarter":
                startDate = new Date(now.getFullYear(), 9, 1);
                endDate = new Date(now.getFullYear(), 12, 0);
                groupBy = { for: { $month: "$date" } };
                break;
            case "This Year":
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                groupBy = { for: { $month: "$date" } };
                break;
            default:
                throw new Error("Invalid option");
        }

        const otherIncomeData = await this.otherIncomeModel.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate }, location: req.user.location } },
            { $group: { _id: groupBy, totalOtherIncome: { $sum: "$amount" } } },
            { $sort: { "_id": 1 } },
            { $project: { _id: 0, for: "$_id.for", totalOtherIncome: 1 } }
        ]);

        return otherIncomeData;
    };

    async calculateOtherIncomeTotals(query: QueryDto, req: any) {
        try {
            const {
                filter = '{}',
                startDate,
                endDate
            } = query;
            const parsedFilter = JSON.parse(filter);

            if (!startDate || !endDate) {
                throw new BadRequestException('Start date and end date are required');
            }
            // Create date filter if provided
            let dateFilter = {};
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            dateFilter = {
                transactionDate: {
                    $gte: start,
                    $lte: end
                }
            };


            const result = await this.otherIncomeModel.aggregate([
                {
                    $match: {
                        ...parsedFilter,
                        ...dateFilter,
                        location: req.user.location
                    }
                },

                {
                    $group: {
                        _id: null, // Group all documents into a single result
                        totalIncome: {
                            $sum: "$amount" // Sum the 'totalAmount' from each document
                        },
                    }
                },
                {
                    $project: {
                        _id: 0 // Optional: Exclude the default _id field for a cleaner output
                    }
                }

            ]);

            // Return default values if no results
            if (!result.length) {
                return {
                    totalIncome: 0
                };
            }

            return result[0];
        } catch (error) {
            errorLog(`Error calculating sales totals: ${error}`, "ERROR");
            throw new InternalServerErrorException(error);
        }
    }

}
