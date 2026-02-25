import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateBlogDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}
