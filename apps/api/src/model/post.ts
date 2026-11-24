import { Model, DataTypes } from "sequelize";
import newSequelize from "../infra/sequelize";
import { DEFAULT_POST_AUTHOR, POST_LIMITS } from "../constant/post";

export interface PostInterface {
    id?: number;
    title: string;
    content: string;
    author?: string;
    tags?: string[];
    published?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

class Post extends Model<PostInterface> implements PostInterface {
    public id?: number;
    public title!: string;
    public content!: string;
    public author?: string;
    public tags?: string[];
    public published?: boolean;
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

Post.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: new DataTypes.STRING(POST_LIMITS.TITLE_MAX),
            allowNull: false,
        },
        content: {
            type: new DataTypes.TEXT(),
            allowNull: false,
        },
        author: {
            type: new DataTypes.STRING(POST_LIMITS.AUTHOR_MAX),
            allowNull: false,
            defaultValue: DEFAULT_POST_AUTHOR,
        },
        tags: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        published: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: "posts",
        freezeTableName: true,
        timestamps: true,
        // Columns are snake_case in the database (created_at), attributes are camelCase in code
        underscored: true,
        sequelize: newSequelize(),
        modelName: "posts",
    }
);

export default Post;
