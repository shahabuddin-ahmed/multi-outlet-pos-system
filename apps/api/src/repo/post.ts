import Post, { PostInterface } from "../model/post";

export type PostInput = Omit<PostInterface, "id" | "createdAt" | "updatedAt">;

export interface PostRepoInterface {
    create(post: PostInput): Promise<PostInterface>;
    findById(id: number): Promise<PostInterface | null>;
    list(offset: number, limit: number): Promise<PostInterface[]>;
    update(id: number, changes: Partial<PostInput>): Promise<PostInterface | null>;
    delete(id: number): Promise<boolean>;
    count(): Promise<number>;
}

export class PostRepo implements PostRepoInterface {
    public async create(post: PostInput): Promise<PostInterface> {
        const created = await Post.create(post);
        return created.get({ plain: true });
    }

    public async findById(id: number): Promise<PostInterface | null> {
        const post = await Post.findByPk(id);
        return post ? post.get({ plain: true }) : null;
    }

    public async list(offset: number, limit: number): Promise<PostInterface[]> {
        const posts = await Post.findAll({
            offset,
            limit,
            // id breaks ties, so pages never repeat or skip rows
            order: [
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
        });
        return posts.map((post) => post.get({ plain: true }));
    }

    public async update(id: number, changes: Partial<PostInput>): Promise<PostInterface | null> {
        const [, rows] = await Post.update(changes, { where: { id }, returning: true });
        return rows.length > 0 ? rows[0].get({ plain: true }) : null;
    }

    public async delete(id: number): Promise<boolean> {
        const deleted = await Post.destroy({ where: { id } });
        return deleted > 0;
    }

    public async count(): Promise<number> {
        return Post.count();
    }
}

export const newPostRepo = async (): Promise<PostRepoInterface> => {
    return new PostRepo();
};

export default PostRepo;
