import { ERROR_CODES } from "../constant/error";
import { PostInterface } from "../model/post";
import { PostInput, PostRepoInterface } from "../repo/post";
import { NotFoundException } from "../web/exception/not-found-exception";

export interface PostPage {
    data: PostInterface[];
    offset: number;
    limit: number;
    total: number;
}

export interface PostServiceInterface {
    create(post: PostInput): Promise<PostInterface>;
    getById(id: number): Promise<PostInterface>;
    list(offset: number, limit: number): Promise<PostPage>;
    update(id: number, changes: Partial<PostInput>): Promise<PostInterface>;
    remove(id: number): Promise<void>;
}

const POST_NOT_FOUND = "Post not found";

export class PostService implements PostServiceInterface {
    constructor(private repo: PostRepoInterface) {}

    async create(post: PostInput): Promise<PostInterface> {
        return this.repo.create(post);
    }

    async getById(id: number): Promise<PostInterface> {
        const post = await this.repo.findById(id);
        if (!post) {
            throw new NotFoundException(ERROR_CODES.E_NOT_FOUND, POST_NOT_FOUND);
        }
        return post;
    }

    async list(offset: number, limit: number): Promise<PostPage> {
        const [data, total] = await Promise.all([this.repo.list(offset, limit), this.repo.count()]);
        return { data, offset, limit, total };
    }

    async update(id: number, changes: Partial<PostInput>): Promise<PostInterface> {
        const updated = await this.repo.update(id, changes);
        if (!updated) {
            throw new NotFoundException(ERROR_CODES.E_NOT_FOUND, POST_NOT_FOUND);
        }
        return updated;
    }

    async remove(id: number): Promise<void> {
        const removed = await this.repo.delete(id);
        if (!removed) {
            throw new NotFoundException(ERROR_CODES.E_NOT_FOUND, POST_NOT_FOUND);
        }
    }
}

export const newPostService = async (repo: PostRepoInterface): Promise<PostService> => {
    return new PostService(repo);
};
