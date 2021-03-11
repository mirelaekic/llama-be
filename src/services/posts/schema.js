const { Schema, model } = require("mongoose");

const PostSchema = new Schema(
  {
    postImg: String,
    description: {
      type: String,
    },
    userId: String,
  },
  { timestamps: true }
);

PostSchema.static("findPostWithAuthor", async (id) => {
  const post = await this.findById(id).populate(author);
  return post;
});

const postModel = model("post", PostSchema);
module.exports = postModel;
