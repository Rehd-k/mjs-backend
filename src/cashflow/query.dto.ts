import { IsDate, IsInt, IsJSON, IsOptional, IsString, Min } from "class-validator";

export class QueryDto {
    @IsOptional()
    @IsJSON()
    filter?: string; // JSON string for filtering

    @IsOptional()
    @IsJSON()
    sort?: string; // JSON string for sorting

    @IsOptional()
    @IsInt()
    @Min(0)
    limit?: number; // Number of results per page

    @IsOptional()
    @IsInt()
    @Min(0)
    skip?: number; // Number of results to skip

    @IsOptional()
    @IsString()
    select?: string; // Comma-separated fields to select

    @IsOptional()
    @IsDate()
    startDate?: Date; // Start date for filtering

    @IsOptional()
    @IsDate()
    endDate?: Date;

    @IsOptional()
    @IsString()
    search?: string;


    @IsOptional()
    @IsString()
    selectedDateField?: string; // Field to filter by date
}
